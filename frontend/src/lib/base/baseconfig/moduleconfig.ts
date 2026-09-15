import { FeatureCode } from './features';

/**
 * Modül yapılandırmasının tip tanımları.
 *
 * Her modül (örneğin transfers) bir ModuleConfig ile tanımlanır; altındaki
 * transaction'ları, kendi rengini ve arka plan animasyonunu taşır. Menü,
 * vurgu rengi ve arka plan artık sunucudan gelen tek bir listeden değil
 * içinde bulunulan modülün yapılandırmasından kurulur; böylece transfers
 * altındaki bir ekran ile customers altındaki bir ekran farklı görünür.
 *
 * Yapılandırma <modül>.routes.ts içinde route verisine 'moduleConfig'
 * anahtarıyla konur; FlowService oradan okur.
 */

/** Menüdeki tek bir ekran bağlantısı. */
export interface ModuleMenuItem {
  /** Kaynak anahtarı; menüde görünen metin bununla çevrilir. */
  code: string;
  /** Kaynak karşılığı yoksa gösterilecek metin. */
  title: string;
  /** Gidilecek adres. */
  path: string;
  /** Özellik kodu. Verilirse bağlantı yalnızca o bayrak açıkken görünür. */
  isEnable?: FeatureCode;
}

/** Bir modülün kimliği, rengi, arka planı ve menüsü. */
export interface ModuleConfig {
  /**
   * Modül kodu. Menü başlığı bununla çevrilir ve modül geçiş listesinde
   * içinde bulunulan modülü işaretlemek için sunucudan gelen kodla eşleşir.
   */
  code: string;
  /** Kaynak karşılığı yoksa gösterilecek modül adı. */
  title: string;
  /**
   * Modülün kendi rengi.
   *
   * '--color-module' değişkenine yazılır; menüdeki açık ekran, üst şeridin
   * çizgisi ve arka plan parıltısı bunu kullanır. Seçili tema zemini
   * belirlemeye devam eder, bu renk yalnızca modülü ayırt eder.
   */
  color: string;
  /**
   * Arka planda dönen animasyonun adresi.
   *
   * Animasyon dosyanın kendisinde (SMIL); kod tarafında animasyon yok.
   * Dosyadaki renk bu yapılandırmadaki color ile aynı tutulur.
   */
  background: string;
  /** Modülün altındaki ekranlar, menüde gösterilecek sırayla. */
  transactions: ModuleMenuItem[];
}
