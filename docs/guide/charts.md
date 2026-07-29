# Charts

Lumen selects the right visualization for each column automatically. No manual configuration required.

![Charts grid](/screenshot.png)

## Chart Types

### Histogram
Numeric columns render as histograms with 10 equal-width bins. Shows the distribution shape — clusters, gaps, outliers — at a glance. Up to 5 histograms render per dashboard.

### Category Bar
Text columns with fewer than 20 unique values render as horizontal bar charts showing the frequency of each category. Up to 3 category bars render.

### Time-Series Line
When a date column and a numeric column exist, Lumen plots a line chart of the numeric values over time. Points are sorted chronologically.

### Metric Bar
When a text category column pairs with a numeric column, Lumen shows the mean of the numeric value grouped by category as a vertical bar chart.

### Doughnut
The text column with the highest cardinality renders as a proportional doughnut chart, showing each category's share of the whole.

## Fullscreen Mode

Hover any chart to reveal the expand button. Click it to open the chart in fullscreen.

- **Scroll** to zoom in and out
- **Drag** to pan
- **Reset zoom** returns to the default view
- **Escape** or click the backdrop to close

## Focus Mode

Click any column in the sidebar to filter every chart to that column's data. Click again to return to the full view.

## Color Palette

All charts use the active theme's 6-color palette. Switching themes updates charts immediately with a smooth 0.3s transition.
