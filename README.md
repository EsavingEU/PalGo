# PalGo - Ottimizzatore Bilico Centinato 3D

PalGo è un'applicazione web interattiva per ottimizzare il posizionamento dei pallet su un bilico centinato. Utilizza un algoritmo di 3D bin packing per determinare la disposizione ottimale dei pallet e verifica se tutti i limiti del mezzo vengono rispettati.

## Caratteristiche

- ✅ **Inserimento pallet flessibile**: Inserisci pallet con dimensioni personalizzate (lunghezza, larghezza, altezza, peso)
- ✅ **Ottimizzazione 3D**: Algoritmo intelligente che posiziona i pallet ottimizzando lo spazio
- ✅ **Visualizzazione 3D interattiva**: Visualizza il bilico con i pallet posizionati usando Three.js
- ✅ **Sovrapposizione pallet**: Opzione per rendere i pallet sovrapponibili
- ✅ **Rotazione automatica**: I pallet vengono ruotati automaticamente (90°) per ottimizzare lo spazio
- ✅ **Verifica limiti**:
  - Altezza massima: 2.60m
  - Peso massimo: 25t
  - Verifica se tutti i pallet ci stanno
- ✅ **Rapporto dettagliato**: Mostra cosa non ci sta se il mezzo è pieno

## Specifiche del Bilico

- **Dimensioni**: 13.6m × 2.5m
- **Altezza massima**: 2.60m
- **Peso massimo**: 25t

## Stack Tecnologico

- HTML5
- CSS3 (Tailwind CSS via CDN)
- JavaScript (Vanilla)
- Three.js (visualizzazione 3D)
- Algoritmo 3D Bin Packing

## Come Usare

1. Apri `index.html` nel browser
2. Inserisci i dati dei pallet (dimensioni, peso, sovrapponibile)
3. Clicca su "Aggiungi Pallet" per aggiungere più pallet
4. Clicca su "Ottimizza e Visualizza"
5. Visualizza il risultato 3D interattivo
6. Controlla il rapporto per verificare se tutto ci sta

## Controlli 3D

- **Ruota**: Clicca e trascina
- **Zoom**: Rotella del mouse
- **Pan**: Clicca destro e trascina

## Licenza

MIT License
