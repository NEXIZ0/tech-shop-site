-- TechStore Seed Data
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Insert default roles
INSERT INTO roles (id, name) VALUES 
(1, 'Admin'),
(2, 'User')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert admin and regular user
-- Passwords:
-- Admin: admin@techstore.com / Admin123!
-- User:  jane@example.com   / password123
INSERT INTO users (id, role_id, name, email, password_hash) VALUES 
(1, 1, 'Admin User', 'admin@techstore.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrwOfF/4G.8.tWq0eW80G.gq7M2kGZeD2h6'),
(2, 2, 'Jane Doe', 'jane@example.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrwOfF/4G.8.tWq0eW80G.gq7M2kGZeD2h6')
ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash);

-- 3. Insert categories
INSERT INTO categories (id, name, slug, description, image_url) VALUES 
(1, 'Laptops & Computers', 'laptops-computers', 'High-performance laptops, desktop PCs, and computing accessories for work, gaming, and creative projects.', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'),
(2, 'Smartphones & Tablets', 'smartphones-tablets', 'Latest mobile devices, tablets, and mobile accessories with advanced displays and multi-camera systems.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'),
(3, 'Audio & Headphones', 'audio-headphones', 'Premium noise-canceling headphones, wireless earbuds, bluetooth speakers, and high-fidelity audio equipment.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'),
(4, 'Monitors & Displays', 'monitors-displays', 'Ultra-HD 4K monitors, high-refresh gaming displays, and productivity screens for crisp visuals.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'),
(5, 'Accessories & Peripherals', 'accessories-peripherals', 'Ergonomic mechanical keyboards, wireless precision mice, docking stations, and storage solutions.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description), image_url=VALUES(image_url);

-- 4. Insert products
INSERT INTO products (id, category_id, name, slug, description, price, stock, rating, image_url, is_featured, is_new) VALUES 
(1, 1, 'ProBook Ultra 15 Pro', 'probook-ultra-15-pro', 'An ultra-slim, powerful laptop featuring a 15.6-inch 4K OLED display, 13th Gen Intel Core i9 processor, 32GB RAM, and 1TB NVMe SSD. Perfect for creative professionals and heavy multitasking.', 950000000.00, 25, 4.80, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 1, 1),
(2, 1, 'GamerX Titan Desktop PC', 'gamerx-titan-desktop-pc', 'Ultimate gaming powerhouse with RTX 4080 GPU, AMD Ryzen 9 7900X CPU, 32GB DDR5 RAM, 2TB SSD, and custom liquid cooling in a sleek tempered glass chassis.', 1250000000.00, 10, 4.90, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800', 1, 0),
(3, 2, 'Apex Phone 15 Pro Max', 'apex-phone-15-pro-max', 'Next-generation flagship smartphone with titanium frame, 120Hz Super Retina XDR display, 48MP triple camera system with 5x optical zoom, and all-day battery life.', 600000000.00, 40, 4.70, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', 1, 1),
(4, 2, 'TabStudio Pro 12.9', 'tabstudio-pro-129', 'Versatile tablet featuring a Liquid Retina XDR screen, high-performance octa-core processor, stylus support, and 256GB storage for digital artists and professionals.', 450000000.00, 15, 4.60, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', 0, 0),
(5, 3, 'SoundSphere Wireless ANC Headphones', 'soundsphere-wireless-anc-headphones', 'Industry-leading active noise-canceling wireless over-ear headphones with custom 40mm drivers, 30-hour battery life, and crystal-clear hands-free calling.', 175000000.00, 50, 4.85, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 1, 1),
(6, 3, 'PulseBuds Pro Wireless Earbuds', 'pulsebuds-pro-wireless-earbuds', 'True wireless earbuds with active noise cancellation, transparency mode, spatial audio, IPX4 water resistance, and up to 24 hours total playback with charging case.', 90000000.00, 60, 4.50, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 0, 0),
(7, 4, 'UltraView 32-inch 4K Monitor', 'ultraview-32-inch-4k-monitor', 'Stunning 32-inch 4K UHD IPS display with 99% sRGB color accuracy, HDR400 support, USB-C 65W power delivery, and ergonomic height-adjustable stand.', 275000000.00, 20, 4.75, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 1, 0),
(8, 5, 'MechKey Pro Wireless Mechanical Keyboard', 'mechkey-pro-wireless-mechanical-keyboard', 'Custom mechanical keyboard with tactile hot-swappable switches, per-key RGB backlighting, aluminum body, multi-device Bluetooth and 2.4GHz connectivity.', 75000000.00, 35, 4.65, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 0, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description), price=VALUES(price), stock=VALUES(stock), rating=VALUES(rating), image_url=VALUES(image_url), is_featured=VALUES(is_featured), is_new=VALUES(is_new);

-- 5. Insert product images
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 1),
(1, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800', 0),
(2, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800', 1),
(3, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', 1),
(4, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', 1),
(5, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 1),
(6, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 1),
(7, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 1),
(8, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 1);

-- 6. Insert product specs
INSERT INTO product_specs (product_id, spec_key, spec_value) VALUES
(1, 'Processor', 'Intel Core i9-13900H (14 cores, up to 5.4GHz)'),
(1, 'Display', '15.6-inch 4K OLED (3840 x 2160), 100% DCI-P3'),
(1, 'Memory', '32GB LPDDR5 6000MHz'),
(1, 'Storage', '1TB PCIe 4.0 NVMe M.2 SSD'),
(1, 'Graphics', 'NVIDIA GeForce RTX 4070 8GB GDDR6'),
(1, 'Battery', '99.9Wh, up to 10 hours runtime'),
(2, 'Processor', 'AMD Ryzen 9 7900X (12 cores, 24 threads)'),
(2, 'Graphics', 'NVIDIA GeForce RTX 4080 16GB GDDR6X'),
(2, 'Memory', '32GB DDR5 5600MHz RGB'),
(3, 'Display', '6.7-inch Super Retina XDR OLED (120Hz)'),
(3, 'Storage', '256GB NVMe'),
(4, 'Display', '12.9-inch Liquid Retina XDR'),
(4, 'Storage', '256GB High-Speed Flash'),
(5, 'Battery Life', 'Up to 30 hours with ANC enabled'),
(5, 'Noise Cancellation', 'Adaptive Active Noise Cancelling (ANC)'),
(6, 'Battery Life', 'Up to 24 hours with wireless charging case'),
(7, 'Resolution', '3840 x 2160 (4K UHD)'),
(8, 'Switches', 'Hot-swappable tactile mechanical switches');

-- 7. Insert reviews
INSERT INTO reviews (product_id, user_id, rating, comment, is_approved) VALUES
(1, 2, 5, 'Outstanding laptop! The OLED display is breathtaking and it handles video editing seamlessly.', 1),
(1, 2, 4, 'Great build quality and top performance, though battery life drops during heavy gaming.', 1),
(3, 2, 5, 'The camera performance on this phone is unreal. Very happy with the titanium design.', 1),
(5, 2, 5, 'Best noise cancellation I have ever experienced. Super comfortable for long flights.', 1);

-- 8. Insert product questions
INSERT INTO product_questions (product_id, user_id, question, answer, status) VALUES
(1, 2, 'Does this laptop support RAM upgrades?', 'The 32GB RAM is soldered onto the motherboard for maximum bandwidth, so it cannot be upgraded post-purchase.', 'Answered'),
(1, 2, 'Is the keyboard backlit?', 'Yes, it features a 3-level white LED backlight with an ambient light sensor.', 'Answered'),
(3, 2, 'Does it come with a charger in the box?', 'The box includes a USB-C charging cable, but the wall adapter is sold separately.', 'Answered');

SET FOREIGN_KEY_CHECKS = 1;
