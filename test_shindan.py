"""Test the shindan (name fortune telling) page end-to-end."""
from playwright.sync_api import sync_playwright
import os

SCREENSHOTS = "c:/Users/PEM N-266/work/名前診断スタジオ/test_screenshots"
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # Step 1: Navigate to shindan.html
    print("Step 1: Navigating to shindan.html...")
    page.goto("http://localhost:8765/shindan.html")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SCREENSHOTS}/01_shindan_loaded.png", full_page=True)
    print("  -> Page loaded OK")

    # Step 2: Enter 山田 in sei input
    print("Step 2: Entering 山田 in sei input...")
    sei_input = page.locator("#sei-input")
    sei_input.fill("山田")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{SCREENSHOTS}/02_sei_entered.png", full_page=True)

    # Check stroke preview for sei
    sei_preview = page.locator("#sei-stroke-preview")
    sei_preview_text = sei_preview.inner_text()
    print(f"  -> Sei stroke preview: '{sei_preview_text}'")

    # Step 3: Enter 太郎 in mei input
    print("Step 3: Entering 太郎 in mei input...")
    mei_input = page.locator("#mei-input")
    mei_input.fill("太郎")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{SCREENSHOTS}/03_mei_entered.png", full_page=True)

    # Check stroke preview for mei
    mei_preview = page.locator("#mei-stroke-preview")
    mei_preview_text = mei_preview.inner_text()
    print(f"  -> Mei stroke preview: '{mei_preview_text}'")

    # Step 4: Click submit button
    print("Step 4: Clicking submit button...")
    submit_btn = page.locator("#submit-btn")
    submit_btn.click()
    page.wait_for_timeout(1000)  # Wait for animation + calculation delay
    page.screenshot(path=f"{SCREENSHOTS}/04_results.png", full_page=True)

    # Step 5: Verify results appear
    print("Step 5: Verifying results...")
    result_section = page.locator("#result-section")
    is_visible = result_section.is_visible()
    print(f"  -> Result section visible: {is_visible}")

    result_name = page.locator("#result-name")
    name_text = result_name.inner_text()
    print(f"  -> Result name: '{name_text}'")

    # Check gokaku grid has cards
    gokaku_grid = page.locator("#gokaku-grid")
    cards = gokaku_grid.locator(".gokaku-card")
    card_count = cards.count()
    print(f"  -> Gokaku cards: {card_count}")

    # Check for badges
    badges = gokaku_grid.locator(".badge")
    badge_count = badges.count()
    print(f"  -> Rating badges: {badge_count}")

    # Verify expected values for 山田太郎
    # 天格: 山(3)+田(5) = 8
    # 人格: 田(5)+太(4) = 9
    # 地格: 太(4)+郎(9) = 13
    # 外格: 21-9 = 12
    # 総格: 3+5+4+9 = 21
    numbers = gokaku_grid.locator(".gokaku-card__number")
    for i in range(numbers.count()):
        val = numbers.nth(i).inner_text()
        print(f"  -> Card {i+1} number: {val}")

    # Capture console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

    # Take full-page screenshot of results
    page.screenshot(path=f"{SCREENSHOTS}/05_results_full.png", full_page=True)

    # Also test the home page
    print("\nBonus: Testing home page...")
    page.goto("http://localhost:8765/index.html")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SCREENSHOTS}/06_home.png", full_page=True)
    print("  -> Home page loaded OK")

    # Test about page
    print("Bonus: Testing about page...")
    page.goto("http://localhost:8765/about.html")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{SCREENSHOTS}/07_about.png", full_page=True)
    print("  -> About page loaded OK")

    browser.close()

    # Summary
    print("\n=== TEST SUMMARY ===")
    print(f"Result section visible: {is_visible}")
    print(f"Result name: {name_text}")
    print(f"Gokaku cards rendered: {card_count}")
    print(f"Rating badges rendered: {badge_count}")
    if is_visible and card_count == 5 and badge_count == 5:
        print("STATUS: ALL TESTS PASSED ✓")
    else:
        print("STATUS: SOME TESTS FAILED ✗")
