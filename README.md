# HometownLink — Backend

## Stack
- **Node.js + Express** (ES Modules)
- **PostgreSQL** (via `pg`)
- **JWT** + **Sessions** (stockées en PostgreSQL)
- **bcryptjs** pour les mots de passe
- **multer** pour les uploads d'avatars

## Installation

```bash
cd hometownlink-backend
npm install
```

## Configuration

```bash
cp .env.example .env
# Remplir les valeurs dans .env
```

## Base de données

```bash
# 1. Créer la base dans PostgreSQL
psql -U postgres -c "CREATE DATABASE hometownlink;"

# 2. Lancer les migrations (crée toutes les tables)
npm run db:migrate

# 3. Insérer les données de test
npm run db:seed
```

## Démarrage

```bash
npm run dev     # développement (nodemon)
npm start       # production
```

## Routes API

### Auth
| Méthode | Route           | Accès  | Description              |
|---------|-----------------|--------|--------------------------|
| POST    | /auth/login     | Public | Connexion                |
| POST    | /auth/register  | Public | Inscription              |
| POST    | /auth/logout    | Public | Déconnexion              |
| POST    | /auth/refresh   | Public | Rafraîchir le JWT        |
| GET     | /auth/me        | Auth   | Profil connecté          |

### Members
| Méthode | Route                          | Accès  | Description              |
|---------|--------------------------------|--------|--------------------------|
| GET     | /members/bureau                | Public | Membres du bureau        |
| GET     | /members                       | Public | Annuaire communautaire   |
| GET     | /members/:id                   | Public | Profil d'un membre       |
| PATCH   | /members/me                    | Auth   | Modifier son profil      |
| POST    | /members/me/avatar             | Auth   | Changer son avatar       |
| GET     | /admin/members/pending         | Admin  | Demandes en attente      |
| PATCH   | /admin/members/:id/approve     | Admin  | Approuver un membre      |
| DELETE  | /admin/members/:id/reject      | Admin  | Refuser un membre        |

### Events
| Méthode | Route                           | Accès  | Description              |
|---------|---------------------------------|--------|--------------------------|
| GET     | /events?status=upcoming\|past   | Public | Liste des événements     |
| GET     | /events/:id                     | Public | Détail événement         |
| POST    | /events/:id/register            | Auth   | S'inscrire               |
| GET     | /admin/events/registrations     | Admin  | Toutes les inscriptions  |
| POST    | /admin/events                   | Admin  | Créer un événement       |
| DELETE  | /admin/events/:id               | Admin  | Supprimer un événement   |

### Gallery
| Méthode | Route               | Accès  | Description              |
|---------|---------------------|--------|--------------------------|
| GET     | /gallery            | Public | Photos (privées si auth) |
| POST    | /admin/gallery      | Admin  | Ajouter une photo        |
| DELETE  | /admin/gallery/:id  | Admin  | Supprimer une photo      |

### Contact
| Méthode | Route                       | Accès | Description        |
|---------|-----------------------------|-------|--------------------|
| POST    | /contact                    | Public| Envoyer un message |
| GET     | /admin/contact              | Admin | Lire les messages  |
| PATCH   | /admin/contact/:id/read     | Admin | Marquer comme lu   |

## Connecter le frontend

1. Copier `api-frontend.js` → remplacer `src/services/api.js` dans le frontend
2. Mettre à jour `src/context/AuthContext.jsx` pour sauvegarder le token :

```js
const login = useCallback(async (email, password) => {
  const result = await authService.login(email, password);
  if (result.ok) {
    setUser(result.user);
    localStorage.setItem('asso_user',  JSON.stringify(result.user));
    localStorage.setItem('asso_token', result.token); // ← ajouter ça
  }
  return result;
}, []);

const logout = useCallback(async () => {
  await authService.logout();
  setUser(null);
  localStorage.removeItem('asso_user');
  localStorage.removeItem('asso_token'); // ← ajouter ça
}, []);
```

3. Dans `.env` du frontend :
```
VITE_API_URL=http://localhost:3000/api
```
