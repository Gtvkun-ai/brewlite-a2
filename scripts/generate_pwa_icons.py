import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = os.path.join(os.path.dirname(__file__), '../apps/web/public/icons')
os.makedirs(icons_dir, exist_ok=True)

def create_coffee_icon(size):
    # Create image with warm coffee brown background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded background
    padding = int(size * 0.04)
    corner_radius = int(size * 0.22)
    # Background rectangle with rounded corners: #2B1D15 or warm brown #8B4513
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=corner_radius,
        fill=(43, 29, 21, 255) # Dark rich coffee #2B1D15
    )
    
    # Inner gold border ring
    inner_pad = padding + int(size * 0.02)
    draw.rounded_rectangle(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        radius=int(corner_radius * 0.9),
        outline=(218, 165, 32, 120), # Subtle gold
        width=max(2, int(size * 0.015))
    )
    
    center_x = size // 2
    center_y = int(size * 0.52)
    scale = size / 512.0
    
    # Draw Coffee Cup body (warm cream white #FDFBF7)
    cup_color = (253, 251, 247, 255)
    cup_w = int(180 * scale)
    cup_h = int(140 * scale)
    cup_top = center_y - cup_h // 2
    cup_left = center_x - cup_w // 2 - int(15 * scale)
    cup_right = cup_left + cup_w
    cup_bottom = cup_top + cup_h
    
    # Cup body with rounded bottom
    draw.rounded_rectangle(
        [cup_left, cup_top, cup_right, cup_bottom],
        radius=int(30 * scale),
        fill=cup_color
    )
    
    # Coffee liquid inside top rim
    rim_h = int(24 * scale)
    draw.ellipse(
        [cup_left + int(8 * scale), cup_top + int(4 * scale), cup_right - int(8 * scale), cup_top + rim_h],
        fill=(139, 69, 19, 255) # Coffee brown
    )
    
    # Cup handle on the right
    handle_left = cup_right - int(10 * scale)
    handle_top = cup_top + int(20 * scale)
    handle_w = int(55 * scale)
    handle_h = int(80 * scale)
    handle_thick = max(4, int(18 * scale))
    draw.arc(
        [handle_left, handle_top, handle_left + handle_w, handle_top + handle_h],
        start=270, end=90,
        fill=cup_color,
        width=handle_thick
    )
    
    # Saucer / Plate underneath
    saucer_w = int(240 * scale)
    saucer_h = int(24 * scale)
    saucer_left = center_x - saucer_w // 2 - int(15 * scale)
    saucer_top = cup_bottom + int(4 * scale)
    draw.rounded_rectangle(
        [saucer_left, saucer_top, saucer_left + saucer_w, saucer_top + saucer_h],
        radius=int(12 * scale),
        fill=cup_color
    )
    
    # Steam waves rising from cup
    steam_color = (230, 210, 190, 200)
    steam_thick = max(2, int(8 * scale))
    for offset in [-int(40 * scale), 0, int(40 * scale)]:
        sx = center_x + offset - int(15 * scale)
        sy = cup_top - int(35 * scale)
        # 3 wave dots or steam arc
        draw.arc([sx - int(10 * scale), sy - int(25 * scale), sx + int(10 * scale), sy], start=180, end=0, fill=steam_color, width=steam_thick)
        draw.arc([sx - int(10 * scale), sy - int(50 * scale), sx + int(10 * scale), sy - int(25 * scale)], start=0, end=180, fill=steam_color, width=steam_thick)

    return img

# Generate icons
for sz in [192, 512]:
    img = create_coffee_icon(sz)
    out_path = os.path.join(icons_dir, f'icon-{sz}x{sz}.png')
    img.save(out_path, 'PNG')
    print(f'Generated {out_path}')

# Apple Touch Icon (180x180)
apple_img = create_coffee_icon(180)
apple_path = os.path.join(icons_dir, 'apple-touch-icon.png')
apple_img.save(apple_path, 'PNG')
print(f'Generated {apple_path}')

# Favicon (32x32 & 48x48 in ico)
fav_img = create_coffee_icon(64)
fav_path = os.path.join(os.path.dirname(__file__), '../apps/web/public/favicon.ico')
fav_img.save(fav_path, format='ICO', sizes=[(32, 32), (48, 48)])
print(f'Generated {fav_path}')

