import os, subprocess

BASE = os.path.expanduser('~/spiralside')
os.chdir(BASE)

# Files to delete from repo root
TO_DELETE = [
    '_patch_run.py', '_touch.py', 'do_mastersave_patch.py',
    'patch_autosave_style.py', 'patch_build_opfs.py', 'patch_frames_library.py',
    'patch_main_hydration.py', 'patch_main_print_hydration.py', 'patch_main_questchar.py',
    'patch_p10_comic_frame_overlay.py', 'patch_p10_frame_track_no_image_bg.py',
    'patch_p11_book_export_import.py', 'patch_p12_remove_slot_editor_save_btn.py',
    'patch_p13_text_boxes.py', 'patch_p14_fix_backtick_syntax_error.py',
    'patch_p15_positioned_text_boxes.py', 'patch_p16_fix_positioned_bubbles.py',
    'patch_p17_text_box_style_controls.py', 'patch_p18_pass_tb_style_props.py',
    'patch_p19_tb_bg_color_swatch.py', 'patch_p20_mobile_book_editor.py',
    'patch_p21_three_fixes.py', 'patch_p22_mobile_scale_up.py',
    'patch_p22b_mobile_scale_missed.py', 'patch_p23_fix_intro_comic_panels.py',
    'patch_p24_fix_intro_fallback.py', 'patch_p25_comic_image_fill.py',
    'patch_p26_comic_bg_fill.py', 'patch_p27_timeline_split_mode.py',
    'patch_p5_filmstrip.py', 'patch_p6_two_track_filmstrip.py',
    'patch_p7_frame_picker_db_init.py', 'patch_p8_frame_track_fixes.py',
    'patch_p9_scene_slot_delete.py', 'patch_quest_portrait.py',
    'patch_quest_silence_opfs.py', 'patch_railway_annual.py',
    'patch_railway_capture_storage.py', 'patch_railway_final.py',
    'patch_railway_storage_v3.py', 'patch_sheet_chip_opfs.py',
    'patch_sheet_opfs_portrait.py', 'patch_sheet_silence_opfs.py',
    'patch_spiral_send.py', 'patch_store_final.py', 'patch_streak_fix.py',
    'patch_ui_paypal_return.py', 'patch_ui_paypal_v2.py',
    'store_v3.js', 'sync_storage_ui.js', 'sync_v2.js',
    'write_mainpatch.py', 'js/app/views/store_final.js',
    'js/app/folder.js', 'main', '{',
]

removed = []
missing = []
for f in TO_DELETE:
    path = os.path.join(BASE, f)
    if os.path.exists(path):
        os.remove(path)
        removed.append(f)
    else:
        missing.append(f)

print(f'Removed {len(removed)} files')
if missing:
    print(f'Already gone: {len(missing)} files')

# Also add a .gitignore rule to keep patch files out going forward
gi_path = os.path.join(BASE, '.gitignore')
gi_content = open(gi_path).read() if os.path.exists(gi_path) else ''
RULES = '\n# Patch scripts — never commit these\n_patch_run.py\npatch_*.py\ndo_*.py\nwrite_*.py\n'
if '_patch_run.py' not in gi_content:
    with open(gi_path, 'a') as f:
        f.write(RULES)
    print('[OK] .gitignore updated')
else:
    print('[--] .gitignore already has patch rules')

print()
print('Now run:')
print('git add -A && git commit -m "chore: remove patch scripts from root, add .gitignore rules" && git push origin main')
