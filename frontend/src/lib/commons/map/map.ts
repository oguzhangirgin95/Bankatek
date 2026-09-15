import { Component, computed, input, output, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { InfoVariant } from '../info/info';
import { Skeleton } from '../skeleton/skeleton';
import { TOOLTIP_HIDDEN, Tooltip, TooltipState } from '../tooltip/tooltip';
import { TURKEY_PROVINCES, TURKEY_VIEWBOX } from './turkey-map';

/** Haritada bir ile karşılık gelen ölçüm. */
export interface MapPoint {
  /** Şehir kimliği; tıklandığında dışarı verilir. */
  id: string;
  /** İl adı. Harita şekliyle eşleştirmede kullanılır. */
  name: string;
  /** İlin harita üzerindeki yatay konumu. */
  x: number;
  /** İlin harita üzerindeki dikey konumu. */
  y: number;
  /** Gösterilen sayı. Rengin koyuluğunu da bu belirler. */
  value: number;
}

/** Çizime hazır il: şekil bilgisi ve varsa eşleşen veri. */
interface Province {
  name: string;
  /** İlin sınırlarını çizen SVG path verisi. */
  path: string;
  /** Etiketin yerleştirileceği merkezin yatay konumu. */
  cx: number;
  /** Etiketin yerleştirileceği merkezin dikey konumu. */
  cy: number;
  /** Yoğunluk kademesinin opaklığı. Verisi olmayan il için 1. */
  opacity: number;
  /** Bu ile ait veri; yoksa il boş renkle çizilir. */
  point?: MapPoint;
}

/**
 * Yoğunluk kademeleri.
 *
 * Renk temadan geldiği için tonlar opaklıkla üretilir. Aralıklar eşit
 * seçildi; koyu zeminde her kademe bir öncekinden gözle ayırt edilebiliyor.
 */
const OPACITY = [0.4, 0.55, 0.7, 0.85, 1];

/**
 * İl adlarını eşleştirmek için sadeleştirir: küçük harfe çevirir ve Türkçe
 * karakterleri ASCII karşılığına indirger. Böylece backend "Izmir" derken
 * haritada "İzmir" yazıyor olsa da ikisi eşleşir.
 */
function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/i̇/g, 'i')
    .trim();
}

/**
 * Türkiye haritası. İlleri değerlerine göre boyar.
 *
 * Renk temadan (--map-color) gelir, yoğunluk farkı opaklıkla verilir. Bunun
 * iki faydası var: her metrik için ayrı renk listesi tutmak gerekmiyor ve
 * harita seçilen temaya kendiliğinden uyuyor.
 */
@Component({
  selector: 'app-map',
  imports: [Skeleton, Tooltip],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class Map extends BaseComponent {
  /** Haritanın üstündeki başlık. Boşsa çizilmez. */
  readonly title = input<string>('');

  /** Gösterilecek il verileri. Boş dizi verilirse harita yerine bilgi metni çıkar. */
  readonly points = input<MapPoint[]>([]);

  /** Veri boşken gösterilecek metin; ipucunda da bu kullanılır. */
  readonly emptyText = input<string>('Veri yok');

  /** Vurgulanacak ilin kimliği. */
  readonly selectedId = input<string>('');

  /** Renk çeşidi. Boş bırakılırsa harita temanın vurgu rengini kullanır. */
  readonly variant = input<InfoVariant | ''>('');

  /** Tıklanan ilin verisi. */
  readonly pointClicked = output<MapPoint>();

  /** SVG'nin görüntü alanı; harita geometrisiyle birlikte gelir. */
  readonly viewBox = TURKEY_VIEWBOX;

  /**
   * Kademelerin alt sınırları.
   *
   * Değer aralığına değil sıralamaya göre bölünür. Veri çarpık dağıldığında
   * (birkaç büyük şehir, çok sayıda küçük il) eşit aralıklı bölme illerin
   * çoğunu tek tonda topluyordu; sıralamaya göre bölünce her kademeye
   * yakın sayıda il düşüyor.
   */
  private readonly thresholds = computed<number[]>(() => {
    const values = [...new Set(this.points().map((point) => point.value))].sort((a, b) => a - b);

    return OPACITY.map((_, index) => values[Math.floor((index * values.length) / OPACITY.length)] ?? 0);
  });

  /** Bir değerin düştüğü kademenin opaklığı. */
  private opacityOf(value: number): number {
    const index = this.thresholds().filter((threshold) => value >= threshold).length - 1;

    return OPACITY[Math.max(0, index)];
  }

  /**
   * Bütün illeri, varsa verileriyle birlikte çizime hazırlar.
   *
   * Eşleştirme il adı üzerinden yapılır; veri gelmeyen iller de listede kalır,
   * yalnızca boş renkle çizilirler.
   */
  readonly provinces = computed<Province[]>(() => {
    const byName: Record<string, MapPoint> = {};
    this.points().forEach((point) => (byName[plain(point.name)] = point));

    return TURKEY_PROVINCES.map((province) => {
      const point = byName[plain(province.name)];
      return {
        name: province.name,
        path: province.path,
        cx: province.cx,
        cy: province.cy,
        point,
        opacity: point ? this.opacityOf(point.value) : 1,
      };
    });
  });

  /**
   * Alt taraftaki renk göstergesi.
   *
   * Aynı eşiğe denk gelen kademeler ulaşılamaz kalır (o değere sahip iller
   * hep üstteki kademeye düşer), bu yüzden tekrar edenler ayıklanır.
   */
  readonly legend = computed(() => {
    const thresholds = this.thresholds();

    return thresholds
      .map((threshold, index) => ({ threshold, opacity: OPACITY[index], text: `${threshold}+` }))
      .filter((item, index) => index === thresholds.length - 1 || item.threshold !== thresholds[index + 1]);
  });

  /** Seçili il vurgulu çerçeveyle çizilir. */
  isSelected(province: Province): boolean {
    return !!province.point && province.point.id === this.selectedId();
  }

  /** Yalnızca verisi olan iller tıklamaya yanıt verir. */
  select(province: Province): void {
    if (province.point) {
      this.pointClicked.emit(province.point);
    }
  }

  /** Fare üzerindeyken gösterilen ipucunun durumu. */
  readonly tooltip = signal<TooltipState>(TOOLTIP_HIDDEN);

  /** İmlecin bulunduğu yerde il adını ve değerini gösterir; veri yoksa boş metnini. */
  showTooltip(province: Province, event: MouseEvent): void {
    const value = province.point ? String(province.point.value) : this.emptyText();

    this.tooltip.set({
      text: `${province.name}: ${value}`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  /** İmleç ilden ayrılınca ipucunu gizler. */
  hideTooltip(): void {
    this.tooltip.set(TOOLTIP_HIDDEN);
  }
}
