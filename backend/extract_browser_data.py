import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright


async def extract_budget_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, 'old_data.json')

    # Path to old app index.html
    index_path = 'file:///C:/Users/Moid/old-budget/BudgetProject/index.html'
    tracker_path = 'file:///C:/Users/Moid/budget-tracker/index.html'

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        # --- Try year-based format (diom_budget_*) ---
        page = await context.new_page()
        await page.goto(index_path, wait_until='networkidle')
        await page.wait_for_timeout(2000)  # Let JS load data

        year_data = {}
        for year in range(2020, 2036):
            key = f'diom_budget_{year}'
            raw = await page.evaluate(f'() => localStorage.getItem("{key}")')
            if raw:
                try:
                    year_data[str(year)] = json.loads(raw)
                    print(f'Found data for year {year}')
                except json.JSONDecodeError:
                    pass

        await page.close()

        # --- Try tracker format ---
        tracker_data = None
        try:
            page2 = await context.new_page()
            await page2.goto(tracker_path, wait_until='networkidle')
            await page2.wait_for_timeout(2000)
            raw = await page2.evaluate('() => localStorage.getItem("budget_tracker_data")')
            if raw:
                tracker_data = json.loads(raw)
                print('Found budget-tracker data')
            await page2.close()
        except Exception as e:
            print(f'Tracker check skipped: {e}')

        await browser.close()

        if not year_data and not tracker_data:
            print('ERROR: No budget data found in browser localStorage.')
            print('Please open your old budget app in a browser first so data is saved.')
            return False

        result = {
            'source': 'browser_automated_export',
            'exported_at': str(asyncio.get_event_loop().time()),
            'year_data': year_data,
            'tracker_data': tracker_data,
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f'Successfully exported to: {output_path}')
        total_years = len(year_data)
        total_tracker = 'Yes' if tracker_data else 'No'
        print(f'Years found: {total_years} | Tracker data: {total_tracker}')
        return True


if __name__ == '__main__':
    success = asyncio.run(extract_budget_data())
    sys.exit(0 if success else 1)
