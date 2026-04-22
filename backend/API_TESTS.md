# CampusCart API Test Guide

Run these in order. Copy the token from each login response and paste it below.

## Setup — replace this in all commands below
```
TOKEN="paste_your_token_here"
```

---

## 1. Health Check
```bash
curl http://localhost:5000/health
```
**Expected:** `{"status":"ok","message":"CampusCart API is running"}`

---

## 2. Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ravi Kumar",
    "email": "ravi@campus.edu",
    "password": "password123",
    "role": "student",
    "student_id": "CS2021001",
    "phone": "9876543210",
    "hostel": "Boys Hostel A",
    "room_number": "204"
  }'
```
**Expected:** `{"token":"...", "user":{...}}`
> Copy the token → save as STUDENT_TOKEN

---

## 3. Register a Vendor
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Canteen",
    "email": "ramesh@campus.edu",
    "password": "password123",
    "role": "vendor",
    "phone": "9000000001",
    "shop_name": "Ramesh Canteen",
    "description": "Best south indian food on campus",
    "location": "Near Gate 2"
  }'
```
> Copy the token → save as VENDOR_TOKEN

---

## 4. Register a Delivery Partner
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arjun Singh",
    "email": "arjun@campus.edu",
    "password": "password123",
    "role": "delivery_partner",
    "phone": "9111111111",
    "hostel": "Boys Hostel B"
  }'
```
> Copy the token → save as DELIVERY_TOKEN

---

## 5. Create Admin (first time only)
```bash
# Login as any admin first, OR use this bootstrap endpoint:
curl -X POST http://localhost:5000/api/admin/users/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Admin",
    "email": "admin@campuscart.com",
    "password": "admin123"
  }'
```

---

## 6. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ravi@campus.edu","password":"password123"}'
```

---

## 7. Get My Profile
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

## 8. Admin: Approve Vendor
```bash
# First get vendor ID
curl http://localhost:5000/api/admin/vendors \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Then approve
curl -X PATCH http://localhost:5000/api/admin/vendors/VENDOR_ID_HERE/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 9. Vendor: Open Shop
```bash
curl -X PATCH http://localhost:5000/api/vendors/my/toggle \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```
**Expected:** `{"vendor":{"is_open":true,...}}`

---

## 10. Vendor: Add Menu Items
```bash
curl -X POST http://localhost:5000/api/vendors/my/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"name":"Masala Dosa","price":60,"category":"food","description":"Crispy dosa with chutney"}'

curl -X POST http://localhost:5000/api/vendors/my/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"name":"Filter Coffee","price":20,"category":"drinks"}'
```

---

## 11. Student: Browse Vendors
```bash
curl http://localhost:5000/api/vendors \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```
> Copy a vendor ID from the response

---

## 12. Student: View Vendor Menu
```bash
curl http://localhost:5000/api/vendors/VENDOR_ID_HERE \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```
> Copy a menu_item_id from the response

---

## 13. Student: Place Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "vendor_id": "VENDOR_ID_HERE",
    "delivery_address": "Boys Hostel A, Room 204",
    "special_note": "Extra chutney please",
    "items": [
      {"menu_item_id": "MENU_ITEM_ID_HERE", "quantity": 2}
    ]
  }'
```
> Copy order ID from response → save as ORDER_ID

---

## 14. Vendor: Accept Order
```bash
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/accept \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

## 15. Vendor: Mark Preparing
```bash
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/preparing \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

## 16. Vendor: Mark Ready
```bash
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/ready \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

---

## 17. Delivery Partner: See Available Orders
```bash
curl http://localhost:5000/api/delivery/available \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

## 18. Delivery Partner: Accept Order
```bash
curl -X POST http://localhost:5000/api/delivery/orders/ORDER_ID/accept \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

## 19. Delivery Partner: Mark Delivered
```bash
curl -X PATCH http://localhost:5000/api/delivery/orders/ORDER_ID/delivered \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

---

## 20. Student: Check Order Status
```bash
curl http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```
**Expected status:** `"delivered"`

---

## 21. Delivery Partner: Earnings
```bash
curl http://localhost:5000/api/delivery/earnings \
  -H "Authorization: Bearer $DELIVERY_TOKEN"
```

---

## 22. Admin: Stats
```bash
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"No token provided"` | Missing Authorization header | Add `Authorization: Bearer TOKEN` |
| `"Vendor is currently closed"` | Shop is closed | Call `/vendors/my/toggle` first |
| `"Vendor is not approved"` | Not approved by admin | Admin must call `/admin/vendors/:id/approve` |
| `"Only pending orders can be cancelled"` | Order already accepted | Cannot cancel at this stage |
| `"Order already taken"` | Another partner took it | Refresh available orders |
