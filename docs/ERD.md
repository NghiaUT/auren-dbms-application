// ============================================================
// Luxury Furniture E-commerce - Core ERD (16 tables, MySQL)
// Docs: https://dbml.dbdiagram.io/docs
// Paste into https://dbdiagram.io/d to render
// ============================================================

Project luxury_furniture {
database_type: 'MySQL'
Note: 'Ứng dụng thương mại điện tử nội thất luxury - schema Core (16 bảng)'
}

// ------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------
enum user_role {
admin
sales
customer
}

enum location_type {
showroom
warehouse
}

enum material_type {
wood
leather
stone
metal
fabric
glass
}

enum variant_status {
active
discontinued
}

enum edition_status {
available
reserved
sold
}

enum order_status {
pending
confirmed
in_production
shipped
delivered
cancelled
}

enum payment_type {
deposit
installment
final
}

enum payment_status {
pending
paid
overdue
refunded
}

// ------------------------------------------------------------
// GROUP A - USERS
// ------------------------------------------------------------
Table users {
id int [pk, increment]
email varchar(150) [not null, unique]
password_hash varchar(255) [not null]
full_name varchar(120) [not null]
role user_role [not null, default: 'customer']
created_at datetime [not null, default: `now()`]

Note: 'Tài khoản đăng nhập. role = sales dùng làm nhân viên phụ trách đơn'
}

Table membership_tiers {
id int [pk, increment]
name varchar(30) [not null, unique, note: 'Silver / Gold / Black']
min_spent decimal(15,2) [not null, default: 0, note: 'Ngưỡng chi tiêu để đạt hạng']
discount_pct decimal(5,2) [not null, default: 0]
}

Table customers {
id int [pk, increment]
user_id int [not null, unique, note: '1:1 với users']
tier_id int [not null]
phone varchar(20)
address varchar(255)
city varchar(80)
total_spent decimal(15,2) [not null, default: 0]
created_at datetime [not null, default: `now()`]

indexes {
city
tier_id
}
}

// ------------------------------------------------------------
// GROUP B - CATALOG
// ------------------------------------------------------------
Table brands {
id int [pk, increment]
name varchar(100) [not null, unique]
country varchar(60)
founded_year smallint
}

Table categories {
id int [pk, increment]
parent_id int [null, note: 'Tự tham chiếu: Phòng khách > Sofa > Sofa góc']
name varchar(100) [not null]
slug varchar(120) [not null, unique]

indexes {
parent_id
}
}

Table products {
id int [pk, increment]
brand_id int [not null]
category_id int [not null]
name varchar(200) [not null]
description text
collection_name varchar(120)
designer_name varchar(120)
is_limited boolean [not null, default: false]
is_made_to_order boolean [not null, default: false]
created_at datetime [not null, default: `now()`]

indexes {
(category_id, brand_id)
name
}

Note: 'Sản phẩm gốc. Giá và kích thước nằm ở product_variants'
}

Table materials {
id int [pk, increment]
name varchar(100) [not null, unique]
type material_type [not null]
origin varchar(80)
}

Table product_variants {
id int [pk, increment]
product_id int [not null]
sku varchar(60) [not null, unique]
size varchar(60) [note: 'Ví dụ: 240x100x85 cm']
finish varchar(60) [note: 'Màu hoàn thiện']
price decimal(15,2) [not null]
lead_time_days int [not null, default: 0, note: 'Thời gian sản xuất (made-to-order)']
status variant_status [not null, default: 'active']

indexes {
(product_id, price)
}
}

Table variant_materials {
variant_id int [not null]
material_id int [not null]
portion decimal(5,2) [note: '% chất liệu trong biến thể']
finish_note varchar(120)

indexes {
(variant_id, material_id) [pk]
}

Note: 'Bảng nối N:M giữa product_variants và materials'
}

// ------------------------------------------------------------
// GROUP C - INVENTORY
// ------------------------------------------------------------
Table locations {
id int [pk, increment]
name varchar(120) [not null]
type location_type [not null]
city varchar(80)
}

Table inventory {
variant_id int [not null]
location_id int [not null]
qty_on_hand int [not null, default: 0]
qty_reserved int [not null, default: 0]
version int [not null, default: 0, note: 'Optimistic locking']

indexes {
(variant_id, location_id) [pk]
}

Note: 'Bảng nối N:M variants x locations, mang số lượng tồn'
}

Table edition_units {
id int [pk, increment]
variant_id int [not null]
order_item_id int [null, unique, note: 'NULL khi chưa bán']
serial_no varchar(40) [not null, unique, note: 'Ví dụ: 07/50']
status edition_status [not null, default: 'available']

indexes {
(variant_id, status)
}

Note: 'Từng chiếc limited edition, điểm demo Concurrency'
}

// ------------------------------------------------------------
// GROUP D - SALES
// ------------------------------------------------------------
Table orders {
id int [pk, increment]
customer_id int [not null]
sales_user_id int [null, note: 'Nhân viên sales phụ trách']
order_date datetime [not null, default: `now()`]
status order_status [not null, default: 'pending']
subtotal decimal(15,2) [not null, default: 0]
discount decimal(15,2) [not null, default: 0]
total decimal(15,2) [not null, default: 0]
shipping_address varchar(255) [not null, note: 'Snapshot địa chỉ lúc đặt']
delivery_date date

indexes {
(customer_id, order_date)
(status, total)
order_date
}
}

Table order_items {
id int [pk, increment]
order_id int [not null]
variant_id int [not null]
location_id int [not null, note: 'Kho/showroom xuất hàng']
quantity int [not null, default: 1]
unit_price decimal(15,2) [not null, note: 'Giá chốt tại thời điểm bán']
customization json [note: 'Yêu cầu tuỳ chỉnh: chất liệu, màu, kích thước']

indexes {
order_id
variant_id
}
}

// ------------------------------------------------------------
// GROUP E - PAYMENT
// ------------------------------------------------------------
Table payments {
id int [pk, increment]
order_id int [not null]
type payment_type [not null]
amount decimal(15,2) [not null]
due_date date
paid_at datetime [null]
method varchar(40) [note: 'Chuyển khoản / thẻ / tiền mặt']
status payment_status [not null, default: 'pending']

indexes {
(order_id, type)
(status, due_date)
}

Note: 'Gộp đặt cọc, trả góp, thanh toán cuối vào một bảng'
}

// ------------------------------------------------------------
// GROUP F - ENGAGEMENT
// ------------------------------------------------------------
Table reviews {
id int [pk, increment]
customer_id int [not null]
product_id int [not null]
order_item_id int [not null, note: 'Xác thực đã mua']
rating tinyint [not null, note: '1-5']
comment text
created_at datetime [not null, default: `now()`]

indexes {
(product_id, rating)
(customer_id, order_item_id) [unique]
}
}

// ============================================================
// RELATIONSHIPS
// ============================================================

// Users
Ref: customers.user_id - users.id // 1:1
Ref: customers.tier_id > membership_tiers.id
Ref: orders.sales_user_id > users.id

// Catalog
Ref: categories.parent_id > categories.id // tự tham chiếu
Ref: products.brand_id > brands.id
Ref: products.category_id > categories.id
Ref: product_variants.product_id > products.id
Ref: variant_materials.variant_id > product_variants.id
Ref: variant_materials.material_id > materials.id

// Inventory
Ref: inventory.variant_id > product_variants.id
Ref: inventory.location_id > locations.id
Ref: edition_units.variant_id > product_variants.id
Ref: edition_units.order_item_id - order_items.id // 1:0..1

// Sales
Ref: orders.customer_id > customers.id
Ref: order_items.order_id > orders.id
Ref: order_items.variant_id > product_variants.id
Ref: order_items.location_id > locations.id

// Payment
Ref: payments.order_id > orders.id

// Reviews
Ref: reviews.customer_id > customers.id
Ref: reviews.product_id > products.id
Ref: reviews.order_item_id > order_items.id

// ============================================================
// TABLE GROUPS (hiển thị theo cụm trên dbdiagram.io)
// ============================================================
TableGroup users_group {
users
membership_tiers
customers
}

TableGroup catalog_group {
brands
categories
products
materials
product_variants
variant_materials
}

TableGroup inventory_group {
locations
inventory
edition_units
}

TableGroup sales_group {
orders
order_items
payments
}

TableGroup engagement_group {
reviews
}
