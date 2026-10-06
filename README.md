# Avatar Creator

> Crée ton avatar unique en toute simplicité.

Un outil web moderne pour concevoir des icônes personnalisées, adaptées à ton style — pour tes profils, projets ou applications. Rapide, intuitif et créatif.

---

## ✨ Fonctionnalités

- **Personnalisation complète** — choisis les formes, couleurs et expressions pour un rendu unique
- **Aperçu en temps réel** — visualise chaque modification instantanément
- **Export prêt à l'emploi** — icônes adaptées aux profils, apps et projets
- **Interface intuitive** — pas besoin de compétences en design

---

## 🚀 Démarrage rapide

Pré-requis : Node.js et npm — [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd exact-screenshot-replica
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) | UI et typage |
| [Vite](https://vitejs.dev) | Bundler et dev server |
| [Tailwind CSS](https://tailwindcss.com) | Styles utilitaires |
| [shadcn/ui](https://ui.shadcn.com) | Composants UI |

---

## 📁 Structure du projet

```
src/
├── assets/          # Images et ressources statiques
├── components/
│   ├── bloub/       # Composants avatar (formes, expressions)
│   └── ui/          # Composants UI génériques (shadcn)
├── lib/             # Logique métier (couleurs, formes, humeurs)
└── routes/          # Pages de l'application
```

---

## 📜 Licence

Ce code t'appartient — libre à toi de le modifier, déployer et partager.
