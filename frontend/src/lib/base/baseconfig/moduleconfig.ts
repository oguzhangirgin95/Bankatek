import { FeatureCode } from './features';

/**
 * Modül yapılandırmasının tip tanımları.
 *
 * Her modül (örneğin transfers) bir ModuleConfig ile tanımlanır ve altındaki
 * transaction'ları sayar. Menü artık sunucudan gelen tek bir listeden değil,
 * içinde bulunulan modülün yapılandırmasından kurulur; böylece transfers
 * altındaki bir ekran ile customers altındaki bir ekran farklı menü görür.
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

/** Bir modülün kimliği ve o modüldeyken menüde görünen ekranlar. */
export interface ModuleConfig {
  /**
   * Modül kodu. Menü başlığı bununla çevrilir ve modül geçiş listesinde
   * içinde bulunulan modülü işaretlemek için sunucudan gelen kodla eşleşir.
   */
  code: string;
  /** Kaynak karşılığı yoksa gösterilecek modül adı. */
  title: string;
  /** Modülün altındaki ekranlar, menüde gösterilecek sırayla. */
  transactions: ModuleMenuItem[];
}
