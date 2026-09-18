import { Component, computed, inject, signal } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { TourService } from '@lib/base/baseservice/tourservice';
import { Sidemodal } from '../sidemodal/sidemodal';

/** Panelde listelenen tek bir tur durağı. */
interface LearningStop {
  /** Kullanıcının saydığı sıra numarası; 1'den başlar. */
  order: number;
  /** Durağın başlığı, kaynaktan çözülmüş hali. */
  title: string;
  /** Durağın açıklaması, kaynaktan çözülmüş hali. */
  text: string;
}

/**
 * Üst şeritteki bilgilendirme butonu ve arkasındaki öğrenme paneli.
 *
 * Panel, bulunulan ekranın tanıtım turunu durak durak yazar; bir durağa
 * tıklamak turu o duraktan başlatır. Tur zaten yapılandırmada duruyor, burada
 * yalnızca görünür kılınıyor: kullanıcı ilk girişte kaçırdığı ya da kapattığı
 * anlatımı istediği zaman geri çağırabiliyor.
 *
 * Ekranın turu yoksa panel boş kalmaz; hangi ekranlarda tur olduğunu söyleyen
 * bir açıklama gösterilir.
 */
@Component({
  selector: 'app-learning',
  imports: [Sidemodal],
  templateUrl: './learning.html',
  styleUrl: './learning.scss',
})
export class Learning extends BaseComponent {
  private readonly tourService = inject(TourService);

  /** Panel açık mı. */
  protected readonly open = signal(false);

  /** Ekran metinleri. */
  protected readonly labels = computed(() => ({
    title: this.getResource('LEARNING_TITLE', 'Öğrenme adımları'),
    button: this.getResource('LEARNING_BUTTON', 'Bu ekranı tanı'),
    restart: this.getResource('LEARNING_RESTART', 'Turu baştan başlat'),
    reopen: this.getResource('LEARNING_REOPEN', 'İpuçlarını yeniden aç'),
    empty: this.getResource('LEARNING_EMPTY', 'Bu ekran için tanımlı bir tur yok.'),
    emptyHint: this.getResource(
      'LEARNING_EMPTYHINT',
      'Panoya ya da çok adımlı bir işlem ekranına geçtiğinizde bu panel o ekranın adımlarını listeler.',
    ),
    hint: this.getResource('LEARNING_HINT', 'Bir adıma tıklayın, anlatım ekranda o adımdan başlasın.'),
  }));

  /**
   * İçinde bulunulan ekranın adı.
   *
   * Modül yapılandırmasındaki adresler ilk adımı gösterdiği için eşleşme
   * transaction adı üzerinden kuruluyor; onay adımındayken de ekranın adı
   * doğru yazılsın diye.
   */
  protected readonly screen = computed<string>(() => {
    const transaction = this.flowService.transaction();
    const found = this.flowService
      .moduleConfig()
      ?.transactions.find((item) => item.path.split('/').slice(1, 3).join('/') === transaction);

    return found ? this.getResource(found.code, found.title) : '';
  });

  /** Bulunulan ekranın durakları, kaynaktan çözülmüş metinleriyle. */
  protected readonly stops = computed<LearningStop[]>(() =>
    this.tourService.stops().map((stop, index) => ({
      order: index + 1,
      title: this.tourService.label(stop.title),
      text: this.tourService.label(stop.text),
    })),
  );

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  /**
   * Turu verilen duraktan başlatır ve paneli kapatır.
   *
   * Panel açık kalsaydı turun karartma katmanının altında durur, ışık tuttuğu
   * alanı da örterdi.
   */
  protected startFrom(index: number): void {
    this.open.set(false);
    this.tourService.start(index);
  }

  /** "İpuçlarını yeniden aç": gizlenmiş turlar yeniden görünür olur. */
  protected reopen(): void {
    this.open.set(false);
    this.tourService.reset();
  }
}
