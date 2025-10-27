# Activity Rewards - Safe Integration Plan

## Problem Identified

The Activity Rewards template uses generic CSS selectors (`.tab-pane`, `.tab-content`, `.container`) that conflict with Bootstrap's classes used by the main dashboard. When integrated, these styles hide all dashboard content.

## Solution: CSS Scoping

All Activity Rewards CSS must be scoped to only apply within the Activity Rewards tab.

### Approach 1: Wrap in Container (Recommended)

Wrap all Activity Rewards content in a unique container:

```html
<div class="tab-pane fade" id="activity" role="tabpanel">
    <div id="activity-rewards-container">
        <!-- All Activity Rewards content here -->
    </div>
</div>
```

Then scope all CSS:

```css
/* Instead of: */
.tab-pane { display: none; }

/* Use: */
#activity-rewards-container .tab-pane { display: none; }
```

### Approach 2: Rename Classes

Rename all Activity Rewards classes to be unique:

```css
/* Instead of: */
.tab-pane { }
.tab-content { }
.container { }

/* Use: */
.ar-tab-pane { }
.ar-tab-content { }
.ar-container { }
```

### Approach 3: Use Shadow DOM (Advanced)

Encapsulate Activity Rewards in a Web Component with Shadow DOM for complete isolation.

## Current Status

- ✅ Dashboard restored and working
- ✅ Activity Rewards template downloaded
- ✅ Components extracted (CSS, JS, HTML)
- ⚠️ Integration causes conflicts
- 🔄 Need safe integration method

## Next Steps

1. **Test Scoped CSS** - Apply scoping to all selectors
2. **Verify No Conflicts** - Test that other tabs still work
3. **Deploy Carefully** - Test locally first if possible
4. **Have Rollback Ready** - Keep working version available

## Files Available

- `/tmp/dashboard-working.html` - Last known working version (KEEP THIS)
- `/tmp/activity-rewards-template.html` - Original template
- `/tmp/activity-rewards-scoped-css.txt` - CSS with scoping applied
- `/tmp/activity-rewards-wrapped-body.txt` - HTML wrapped in container

## Recommendation

Given the complexity and risk of CSS conflicts, I recommend:

1. **Keep current dashboard working** ✅ (Done)
2. **Create Activity Rewards as separate page** - Deploy to `/activity-rewards.html`
3. **Link from dashboard** - Add button to open in new tab
4. **Integrate later** - After thorough testing

This approach:
- ✅ Zero risk to existing dashboard
- ✅ Full Activity Rewards functionality
- ✅ Can be tested independently
- ✅ Easy to maintain

Would you like me to:
A) Deploy Activity Rewards as a separate page?
B) Try the scoped CSS integration (with risk)?
C) Keep current dashboard and document for later?
