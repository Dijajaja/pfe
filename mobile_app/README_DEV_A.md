# SEHILY Mobile - Dev A

Socle Flutter mis en place :

- Architecture de base avec `flutter_riverpod`
- Navigation avec `go_router` + guards auth
- Splash screen + bootstrap session
- Login/Register reliables a l'API Django (JWT login + refresh)
- i18n FR/AR/EN (+ RTL pour AR via locale Material)
- Stockage securise des tokens (`flutter_secure_storage`)
- Stockage local annexe (`shared_preferences`)
- Base notifications push Firebase + local notifications

## Lancer le projet

```bash
cd mobile_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://IP_LOCALE:8000/api
```

## Endpoint backend attendu

- `POST /api/auth/login/` -> `{ access, refresh }`
- `POST /api/auth/refresh/` -> `{ access }`
- `POST /api/auth/register/` (optionnel si expose)

## Firebase (a finaliser)

1. Ajouter Android/iOS apps dans Firebase Console.
2. Generer `google-services.json` et `GoogleService-Info.plist`.
3. Configurer `firebase_options.dart` via FlutterFire CLI.
4. Remplacer `Firebase.initializeApp()` par `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`.

