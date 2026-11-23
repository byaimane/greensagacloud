import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { Language } from '../types/game';

interface TutorialOverlayProps {
  language: Language;
  onClose: () => void;
}

const STEPS: Record<Language, Array<{ icon: string; title: string; body: string }>> = {
  en: [
    {
      icon: '🌱',
      title: '1. Developed Farm, Orchard & Windmill',
      body: 'Use Hoe (1), Seeds (4–0), Watering Can (2) & Scythe (3). Pick Apples & Peaches from north orchard trees and mill Flour, Cheese & Jam at your Windmill!',
    },
    {
      icon: '🐔',
      title: '2. Pasture Livestock & Smart Sprinklers',
      body: 'Feed Chickens, Cows & Sheep in the south pasture for daily Eggs, Milk & Wool. Upgrade Sprinklers & House in Maya’s Market as you climb Levels 1–10!',
    },
    {
      icon: '🌐',
      title: '3. Multiplayer Valley Map & Plaza',
      body: 'Press G (or click World Map) to fast-travel, visit Neighbor Farms to help water crops, or walk east past Cloverbrook into the Multiplayer Plaza!',
    },
    {
      icon: '🌙',
      title: '4. Sleep to Advance Days & Save',
      body: 'Interact with your Farmhouse door or click Sleep in the top bar to refill stamina, trigger overnight growth & weather, and auto-save.',
    },
  ],
  fr: [
    {
      icon: '🌱',
      title: '1. Ferme Développée, Verger & Moulin',
      body: 'Utilisez Houe (1), Graines (4–0), Arrosoir (2) et Faux (3). Cueillez Pommes & Pêches au verger nord et créez Farine, Fromage & Confiture au Moulin !',
    },
    {
      icon: '🐔',
      title: '2. Animaux & Arroseurs Automatiques',
      body: 'Nourrissez Poules, Vaches et Moutons au pâturage sud. Débloquez Arroseurs, Maison & Outils 3×3 en montant du Niveau 1 à 10 !',
    },
    {
      icon: '🌐',
      title: '3. Carte Multijoueur & Place des Fermiers',
      body: 'Appuyez sur G (ou Carte) pour voyager rapidement, visiter et arroser les fermes voisines, ou rejoindre la Place Multijoueur à l’est !',
    },
    {
      icon: '🌙',
      title: '4. Dormir pour Sauvegarder & Avancer',
      body: 'Passez par votre porte ou cliquez sur Dormir pour restaurer l’endurance, faire pousser vos plantes et sauvegarder automatiquement.',
    },
  ],
  ar: [
    {
      icon: '🌱',
      title: '1. مزرعة متطورة، بستان ومطحنة حرفية',
      body: 'استخدم المجرفة (1) والبذور (4–0) ومرش الماء (2) والمنجل (3). اقطف التفاح والخوخ شمال المزرعة واصنع الدقيق والجبن والمربى في المطحنة!',
    },
    {
      icon: '🐔',
      title: '2. تربية المواشي والري الآلي',
      body: 'أطعم الدجاج والأبقار والأغنام في المرعى الجنوبي، وطوّر المرشات الآلية والمنزل والأدوات عبر المستويات من 1 إلى 10!',
    },
    {
      icon: '🌐',
      title: '3. خريطة اللعب الجماعي وساحة المزارعين',
      body: 'اضغط G أو زر الخريطة للتنقل السريع، الدردشة مع الأصدقاء عبر رمز الغرفة، وزيارة مزارع الجيران لمساعدتهم في السقاية!',
    },
    {
      icon: '🌙',
      title: '4. النوم لاستعادة الطاقة والحفظ التلقائي',
      body: 'تفاعل مع باب المنزل أو اضغط زر النوم لبدء يوم جديد، تجديد الطاقة، وتفعيل الطقس المشمس أو الممطر مع حفظ تلقائي.',
    },
  ],
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ language, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rpg-panel modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="#fde047" />
            <h2 className="font-display" style={{ margin: 0, fontSize: 19 }}>
              {t(language, 'welcomeTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 18px' }}>
          {STEPS[language].map((s, i) => (
            <div key={i} className="item-card" style={{ alignItems: 'flex-start', padding: '9px 12px' }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 1 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#57534e', lineHeight: 1.45 }}>{s.body}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
            <button className="rpg-btn rpg-btn-primary" onClick={onClose}>
              {t(language, 'letsFarm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
