# Seed data

When the API starts in **Development** and the database has no categories or
products yet, it fills the database from `seed.json` and the photos in `Images/`
(see `Seeding/DatabaseSeeder.cs`). It never runs twice: as soon as there is a
category or product in the database, seeding is skipped.

## Re-seeding

Stop the API, delete `server/Api/db.db` and start the API again. To turn seeding
off, set `"Seed": { "Enabled": false }` in `appsettings.Development.json`.

## Logins

Every seeded user has the password `password`. The original admin keeps the
username and password from `appsettings.Development.json` (`admin` / `admin`).

| Username | Role | Notes |
| --- | --- | --- |
| `admin` | Admin | Created by `AuthService.SeedAdmin` |
| `moderator` | Admin | Second admin |
| `greenwave` | User | Vendor: cannabis, grinder |
| `hofmann` | User | Vendor: psychedelics |
| `pharmacist` | User | Vendor: pharmacy |
| `headshop` | User | Vendor: paraphernalia, books |
| `keymaster` | User | Vendor: lockpicking |
| `ghostline` | User | Vendor: privacy and security |
| `atelier` | User | Vendor: replicas |
| `nightowl` | User | Buyer with three past orders |
| `quietbuyer` | User | Buyer with two past orders |
| `anon7731` | User | Buyer with two past orders |
| `dread_pirate` | User | Deactivated: login says the account was seized |

## What gets created

- 8 categories
- 23 listings: 19 approved, 3 pending (for the admin approval flow) and 1 rejected,
  one sold out and one with a single unit left, created over the past two months
- 36 photos, the first photo of each listing is the primary one
- 9 past orders spread over the past six weeks

## Photo credits

All photos are openly licensed (CC0, public domain, CC BY or CC BY-SA) and were
resized to at most 1200 px. Titles and authors are as given on the source page.

| File | Title | Author | License | Source |
| --- | --- | --- | --- | --- |
| `northern-lights-1.jpg` | Cannabis flower buds | elsaolofsson | CC BY 2.0 | [source](https://www.flickr.com/photos/189516854@N06/51385864284) |
| `hash-1.jpg` | Hashish.jpg | Unknown | Public domain | [source](https://commons.wikimedia.org/wiki/File:Hashish.jpg) |
| `hash-2.jpg` | American medical hashish(10).jpg | Mjpresson | CC BY-SA 3.0 | [source](https://commons.wikimedia.org/wiki/File:American_medical_hashish(10).jpg) |
| `prerolls-1.jpg` | Man making a marijuana joint | elsaolofsson | CC BY 2.0 | [source](https://www.flickr.com/photos/189516854@N06/53212029840) |
| `lsd-1.jpg` | Eye of horus blotter art.jpg | Blotter Barn | Public domain | [source](https://commons.wikimedia.org/wiki/File:Eye_of_horus_blotter_art.jpg) |
| `mushrooms-1.jpg` | Psilocybe cubensis | Denis Zabin | CC BY 4.0 | [source](https://www.inaturalist.org/photos/174732278) |
| `mushrooms-2.jpg` | Psilocybe cubensis | Alan Rockefeller | CC BY 4.0 | [source](https://www.inaturalist.org/photos/60932150) |
| `ecstasy-1.jpg` | Ecstasy pills.jpg | Originally uploaded by Willy turner (Transferred by Gyrobo) | Public domain | [source](https://commons.wikimedia.org/wiki/File:Ecstasy_pills.jpg) |
| `ecstasy-2.jpg` | MDMA tablets.jpg | Dominic Milton Trott | CC BY 2.0 | [source](https://commons.wikimedia.org/wiki/File:MDMA_tablets.jpg) |
| `modafinil-1.jpg` | Modafinil 200mg.jpg | WikiLinuz | CC0 | [source](https://commons.wikimedia.org/wiki/File:Modafinil_200mg.jpg) |
| `diazepam-1.jpg` | Diazepam, strips 10 mg (Valium).jpg | DMTrott | CC BY-SA 4.0 | [source](https://commons.wikimedia.org/wiki/File:Diazepam,_strips_10_mg_(Valium).jpg) |
| `diazepam-2.jpg` | Drug - Valium 5 (Diazepam), Roche Australia, circa 1963 | Museums Victoria | CC BY 4.0 | [source](https://collections.museumsvictoria.com.au/items/251207) |
| `grinder-1.jpg` | Cannabis Grinder | elsaolofsson | CC BY 2.0 | [source](https://www.flickr.com/photos/189516854@N06/52445153883) |
| `grinder-2.jpg` | Marijuana Flower Grinder | elsaolofsson | CC BY 2.0 | [source](https://www.flickr.com/photos/189516854@N06/52445081420) |
| `rolling-machine-1.jpg` | Rizla sigarettenroller pic2.JPG | Alf van Beem | Public domain | [source](https://commons.wikimedia.org/wiki/File:Rizla_sigarettenroller_pic2.JPG) |
| `rolling-machine-2.jpg` | Rizla sigarettenroller pic1.JPG | Alf van Beem | Public domain | [source](https://commons.wikimedia.org/wiki/File:Rizla_sigarettenroller_pic1.JPG) |
| `brass-pipe-1.jpg` | Untitled | Unknown | CC0 1.0 | [source](https://www.rawpixel.com/image/5974371/photo-image-hashish-smokiana) |
| `lockpicks-1.jpg` | best 4 lockpicks | zaphad1 | CC BY 2.0 | [source](https://www.flickr.com/photos/25797459@N06/27224281453) |
| `practice-lock-1.jpg` | Double Ball Cutaway Padlock (open).jpg | Dennis van Zuijlekom from Ermelo, The Netherlands | CC BY-SA 2.0 | [source](https://commons.wikimedia.org/wiki/File:Double_Ball_Cutaway_Padlock_(open).jpg) |
| `practice-lock-2.jpg` | Collection of Cutaway Locks and Padlocks.jpg | Dennis van Zuijlekom from Ermelo, The Netherlands | CC BY-SA 2.0 | [source](https://commons.wikimedia.org/wiki/File:Collection_of_Cutaway_Locks_and_Padlocks.jpg) |
| `security-key-1.jpg` | Yubikey4.jpg | Aldolat | CC BY-SA 4.0 | [source](https://commons.wikimedia.org/wiki/File:Yubikey4.jpg) |
| `security-key-2.jpg` | Black YubiKey 12.jpg | Jonathan Molina | CC BY-SA 2.0 | [source](https://commons.wikimedia.org/wiki/File:Black_YubiKey_12.jpg) |
| `sim-cards-1.jpg` | Formats de cartes SIM.jpg | Bidouille82 | CC BY-SA 3.0 | [source](https://commons.wikimedia.org/wiki/File:Formats_de_cartes_SIM.jpg) |
| `flip-phone-1.jpg` | INO CP99 flip phone.jpg | Mk2010 | CC BY 4.0 | [source](https://commons.wikimedia.org/wiki/File:INO_CP99_flip_phone.jpg) |
| `flip-phone-2.jpg` | I am this old. TI-83, a Nokia brick (forgot which model) w/ face templ | stupid_systemus | CC BY 2.0 | [source](https://www.flickr.com/photos/40750945@N06/53070024573) |
| `crypto-wallet-1.jpg` | Two Trezor One hardware wallets and a 5BTC Casascius physical coin by  | Gage Skidmore | CC BY-SA 3.0 | [source](https://commons.wikimedia.org/wiki/File:Two_Trezor_One_hardware_wallets_and_a_5BTC_Casascius_physical_coin_by_Gage_Skidmore.jpg) |
| `crypto-wallet-2.jpg` | 10elqpi.jpg | The original uploader was Ladislav Mecir at English Wikipedi | CC BY-SA 3.0 | [source](https://commons.wikimedia.org/wiki/File:10elqpi.jpg) |
| `dive-watch-1.jpg` | lorier diving watch | Mario A. P. | CC BY-SA 2.0 | [source](https://www.flickr.com/photos/99058495@N00/54455623988) |
| `sunglasses-1.jpg` | 2023 Okulary przeciwsłoneczne Ray-Ban (2).jpg | Jacek Halicki | CC BY-SA 4.0 | [source](https://commons.wikimedia.org/wiki/File:2023_Okulary_przeciws%C5%82oneczne_Ray-Ban_(2).jpg) |
| `sunglasses-2.jpg` | Sunglasses Eyewear | Nitin Dhumal | CC0 1.0 | [source](https://stocksnap.io/photo/sunglasses-eyewear-YH11VR5GQV) |
| `clutch-1.jpg` | PRECIOSA CALENDAR 2023 - Atlas Bijoux 06 | PRECIOSA ORNELA | CC BY 2.0 | [source](https://www.flickr.com/photos/67488680@N04/52604697253) |
| `scifi-paperbacks-1.jpg` | THE MAN WHO SOLD THE MOON by Robert Heinlein. Intro by John Campbell ( | Jim Linwood | CC BY 2.0 | [source](https://www.flickr.com/photos/54238124@N00/49845984998) |
| `scifi-paperbacks-2.jpg` | THE DECEIVERS by Alfred Bester. TOR (1982). 304 pages. Cover by Michae | Jim Linwood | CC BY 2.0 | [source](https://www.flickr.com/photos/54238124@N00/51626369407) |
| `pelican-1.jpg` | All the leaves are brown and the sky is grey | Alan Stanton | CC BY-SA 2.0 | [source](https://www.flickr.com/photos/53921762@N00/51755625912) |
| `banned-books-1.jpg` | Free old books stacked messy | Unknown | CC0 1.0 | [source](https://www.rawpixel.com/image/5917107/free-old-books-stacked-messy-shelf-photo) |
| `banned-books-2.jpg` | Stacked Books | Matt Bango | CC0 1.0 | [source](https://stocksnap.io/photo/stacked-books-DGF2LFZ6JJ) |
