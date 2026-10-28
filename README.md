# PalGo - Ottimizzatore Bilico Centinato 3D

PalGo è un'applicazione web interattiva per ottimizzare il posizionamento dei pallet su un bilico centinato. Utilizza un algoritmo di 3D bin packing per determinare la disposizione ottimale dei pallet e verifica se tutti i limiti del mezzo vengono rispettati.

## Caratteristiche

- ✅ **Gestione Magazzini**: Organizza i pallet per magazzino/ritiro
- ✅ **Inserimento pallet flessibile**: Inserisci pallet con dimensioni personalizzate (lunghezza, larghezza, altezza, peso)
- ✅ **Quantità multipla**: Inserisci più pallet delle stesse dimensioni con un solo campo
- ✅ **Ottimizzazione 3D**: Algoritmo intelligente che posiziona i pallet ottimizzando lo spazio
- ✅ **Visualizzazione 3D multi-mezzo**: Visualizza ogni magazzino su un mezzo distinto
- ✅ **Colori per dimensioni**: Pallet con stesse dimensioni hanno lo stesso colore
- ✅ **Etichette dimensioni**: Visualizza le dimensioni direttamente sul render 3D
- ✅ **Sovrapposizione pallet**: Opzione per rendere i pallet sovrapponibili
- ✅ **Rotazione automatica**: I pallet vengono ruotati automaticamente (90°) per ottimizzare lo spazio
- ✅ **Pulizia render**: Il render viene pulito completamente prima di ogni nuova visualizzazione
- ✅ **Verifica limiti**:
  - Altezza massima: 2.60m
  - Peso massimo: 25t
  - Verifica se tutti i pallet ci stanno
- ✅ **Rapporto dettagliato**: Mostra statistiche per ogni magazzino

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
2. Aggiungi magazzini usando il pulsante "Aggiungi Magazzino"
3. Per ogni magazzino, inserisci i dati dei pallet (dimensioni, peso, sovrapponibile, quantità)
4. Clicca su "Aggiungi Pallet" per aggiungere più pallet allo stesso magazzino
5. Clicca su "Ottimizza e Visualizza" per vedere il render 3D
6. Visualizza ogni magazzino su un mezzo distinto
7. Controlla il rapporto per vedere le statistiche

## Controlli 3D

- **Ruota**: Clicca e trascina
- **Zoom**: Rotella del mouse
- **Pan**: Clicca destro e trascina

## Prossime Funzionalità

- 🔮 Generazione automatica di combinazioni ottimali tra magazzini
- 🔮 Suggerimenti per unire magazzini e ridurre il numero di trasporti

## Licenza

MIT License
