import os
from PIL import Image

public_dir = r"D:\claude_code\portfolio\public"

images = [
    "palms_kitchen_preview.png",
    "mehta_developers_preview.png",
    "crunch_chips_preview.png",
    "digital_dream_preview.png"
]

for filename in images:
    src_path = os.path.join(public_dir, filename)
    if os.path.exists(src_path):
        out_filename = os.path.splitext(filename)[0] + ".webp"
        out_path = os.path.join(public_dir, out_filename)
        
        with Image.open(src_path) as img:
            # Resize image to max 1200px width if larger while maintaining aspect ratio
            if img.width > 1200:
                h = int(img.height * (1200 / img.width))
                img = img.resize((1200, h), Image.Resampling.LANCZOS)
            
            img.save(out_path, "WEBP", quality=80, optimize=True)
            
        orig_size = os.path.getsize(src_path) / 1024
        new_size = os.path.getsize(out_path) / 1024
        print(f"Converted {filename} ({orig_size:.1f} KB) -> {out_filename} ({new_size:.1f} KB) [Savings: {((orig_size - new_size)/orig_size)*100:.1f}%]")
    else:
        print(f"File not found: {src_path}")
