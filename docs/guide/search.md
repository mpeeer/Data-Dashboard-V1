# Search

Find any value across every column instantly. No filters. No SQL. Just type.

![Lumen dashboard with search](/screenshot.png)

## How It Works

The search bar appears in the top bar once a file is loaded. As you type, Lumen scans every value in every column and returns matches ranked by relevance.

Results appear in a dropdown below the search bar. Each result shows:

- **Column name** — where the match was found
- **Matched value** — the actual cell content

## Keyboard Navigation

| Key | Action |
|---|---|
| `↓` `↑` | Navigate results |
| `Enter` | Select highlighted result |
| `Escape` | Close dropdown |
| Any key | Resume typing |

## Selecting a Result

Click a result or press `Enter` to select it. The sidebar scrolls to and highlights the matching column. All charts and statistics update to focus on that column's data.

## Highlighted Matches

When a search is active, matching cells in the data table are highlighted with a subtle amber tint. Matched portions within cells are marked for easy scanning.

## Clearing Search

Click the × button inside the search input, or press `Escape` twice (once to close the dropdown, again to clear). The dashboard returns to its default view.

## Performance

Search is debounced at 150ms. All scanning happens in-memory — no network requests. Works on datasets up to 50 MB without noticeable latency.
