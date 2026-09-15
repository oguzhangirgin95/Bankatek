import { Component, computed, input } from '@angular/core';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';

/**
 * Profil görseli.
 *
 * Fotoğraf verilmezse kişinin baş harflerini gösterir; böylece fotoğrafı
 * olmayan kayıtlarda boş bir kutu yerine anlamlı bir şey görünür.
 */
@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar extends BaseComponent {
  /** Fotoğraf adresi. Boşsa baş harfler gösterilir. */
  readonly src = input<string>('');

  /** Ad soyad. Hem baş harfleri üretmek hem de alt metin için kullanılır. */
  readonly name = input<string>('');

  /** Kenar uzunluğu, piksel. Avatar her zaman kare çizilir. */
  readonly size = input<number>(48);

  /** Adın ilk iki kelimesinin baş harfleri: "Ahmet Yılmaz" için "AY". */
  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
}
