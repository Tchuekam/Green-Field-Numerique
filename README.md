# GreenField · Traçabilité Intégrale & Gestion Agricole
> **Système d'exploitation et de traçabilité numérique : de la parcelle au consommateur.**  
> Conçu selon les directives de design Apple-level (UI/UX d'exception, ergonomie tactile, fonctionnement 100% hors-ligne).

---

## 🌟 Vue d'ensemble du Système

GreenField répond au besoin de pilotage et de traçabilité de la filière plantain (Farine biologique et Chips artisanales) dans la région de Bertoua (Est Cameroun).

### La Règle d'Or Opérationnelle
> **« On saisit une seule fois, dans l'application sur smartphone (au champ ou à l'usine). La feuille de suivi reprend les données chaque semaine pour les consolider et les analyser. »**

```
[Bloc B01-B16] ──(Récolte R-XXX)──> [Lot Usine LF/LC-XXX] ──(Étiquette QR)──> [Client / Commande WhatsApp]
       ▲                                     ▲                                          │
       └─────────── (Scan QR Réclamation : Remontée instantanée de la cause) ───────────┘
```

---

## 📱 Modules de l'Application

### 1. Étape 1 : Production (Expert Agricole & Équipe Terrain)
- **Fiches des 16 Blocs (B01 à B16)** : Vue cartographique SIG (Bertoua), dates de plantation, cycles de fertilisation, comptage des rejets (1 500 plants/ha), variétés (*Bâtard*, *French Sombre*, *Big Ebanga*).
- **Suivi Sanitaire Hors-Ligne** : Enregistrement des observations foliaires, stades phénologiques, alertes maladies et capture photo avec stockage local IndexedDB.
- **Saisie des Récoltes** : Nombre de régimes coupés, pesée au champ en kg, mesure des pertes sur les 3 km de piste vers l'usine, attribution automatique du numéro séquentiel `R-XXX`.
- **Approvisionnement Partenaire** : Suivi des coopératives certifiées pour sécuriser les 30% d'apports externes.

### 2. Étape 2 : Transformation (Responsable d'Usine & Qualité)
- **Réception, Pesée & Tri** : Contrôle de maturité, ouverture de lot relié à la récolte d'origine.
- **Ligne Farine (Rendement cible 20%)** : Fiche de lot `LF-XXX`, heures machine, mesure d'humidité (plafond strict < 12.0%), ensachage 1kg.
- **Ligne Chips (Rendement cible 25%)** : Fiche de lot `LC-XXX`, volume d'huile, contrôle thermostatique (175°C), paquets 250g.
- **Valorisation Déchets & Biogaz** : Pesée des épluchures envoyées au biodigesteur (taux moyen 35%), suivi de la part d'autonomie énergétique en biogaz (cible 15%).
- **Qualité & Étiquetage QR** : Checklist hygiène, validation QC par ingénieur, génération en temps réel des étiquettes adhésives QR Code avec hash cryptographique unique.

### 3. Étape 3 : Commercialisation & Pilotage (Porteur du Projet)
- **Simulateur d'Intake WhatsApp Business (Baileys / n8n)** : Ingestion de commandes clients, vérification en temps réel de la disponibilité du stock physique en magasin, blocage automatique des lots pour prévenir toute rupture.
- **Bons de Livraison & Facturation** : Génération des BL (`BL-XXX`) associant les identifiants de produits individuels.
- **Moteur de Résolution des Réclamations (Scan QR)** : Scanner ou renseigner n'importe quel code QR remonte immédiatement l'intégralité de la chaîne jusqu'au bloc de culture d'origine, à l'historique phytosanitaire et aux relevés thermiques d'usine.

### 4. Feuille de Suivi Hebdomadaire (Pilotage & Financeurs)
- Reproduction interactive des 9 onglets de consolidation :
  1. *Blocs*
  2. *Récoltes*
  3. *Approvisionnement*
  4. *Production*
  5. *Stocks*
  6. *Ventes & Clients*
  7. *Charges réelles*
  8. *Trésorerie & Fonds de roulement*
  9. *Tableau de bord (Objectif 27,9 M FCFA en pleine activité)*
- **Export en 1 Clic** : Génération instantanée d'un export CSV / Excel structuré pour les réunions hebdomadaires.

---

## 🚀 Démarrage & Utilisation

```bash
# 1. Se positionner dans le dossier
cd c:\Users\Rostand\greenfield-app

# 2. Lancer le serveur de développement / prévisualisation
npm run preview -- --port 5173 --host
```

Accédez à l'application depuis votre navigateur :
- **Local** : `http://localhost:5173`
- **Sur smartphone (même réseau Wi-Fi)** : `http://192.168.88.44:5173`
