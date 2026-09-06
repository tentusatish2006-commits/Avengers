import sys

with open('settings.html', encoding='utf-8') as f:
    txt = f.read()

ids = [
    'panel-profile',
    'btn-toggle-edit',
    'btn-save-profile',
    'btn-cancel-edit',
    'prof-mode-badge',
    'prof-avatar-display',
    'prof-display-name',
    'prof-display-badge',
    'prof-display-sub',
    'val-prof-name',
    'input-prof-name',
    'val-prof-badge',
    'input-prof-badge',
    'val-prof-role',
    'input-prof-role',
    'val-prof-sector',
    'input-prof-sector',
    'val-prof-email',
    'input-prof-email',
    'val-prof-phone',
    'input-prof-phone',
    'val-prof-callsign',
    'input-prof-callsign',
    'prof-save-banner',
    'btn-reset-defaults'
]

missing = [i for i in ids if f'id="{i}"' not in txt and f"id='{i}'" not in txt]
if missing:
    print('FAILED, Missing IDs:', missing)
    sys.exit(1)

print('SUCCESS: All 25 profile elements and controls are present in settings.html!')
