#!/usr/bin/env python3
"""
Seed test data for Home & Own application
Creates sample users, properties, bookings, and inquiries for testing
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.supabase_client import db
from app.core.crypto import hash_password
import datetime as dt
import uuid

async def seed_data():
    print("🌱 Starting to seed test data...")
    
    # Create test users
    users_data = [
        {
            'id': str(uuid.uuid4()),
            'email': 'buyer@homeandown.com',
            'password_hash': hash_password('password123'),
            'first_name': 'John',
            'last_name': 'Buyer',
            'user_type': 'buyer',
            'phone_number': '+919876543210',
            'status': 'active',
            'verification_status': 'verified',
            'email_verified': True,
            'custom_id': 'HUSER01',
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'email': 'seller@homeandown.com',
            'password_hash': hash_password('password123'),
            'first_name': 'Sarah',
            'last_name': 'Seller',
            'user_type': 'seller',
            'phone_number': '+919876543211',
            'status': 'active',
            'verification_status': 'verified',
            'email_verified': True,
            'custom_id': 'HUSER02',
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'email': 'agent@homeandown.com',
            'password_hash': hash_password('password123'),
            'first_name': 'Mike',
            'last_name': 'Agent',
            'user_type': 'agent',
            'phone_number': '+919876543212',
            'status': 'active',
            'verification_status': 'verified',
            'email_verified': True,
            'custom_id': 'HAGENT01',
            'agent_license_number': 'HA10001',
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        }
    ]
    
    print("📝 Creating test users...")
    for user in users_data:
        try:
            # Check if user exists
            existing = await db.admin_select('users', filters={'email': user['email']})
            if existing:
                print(f"   ✓ User {user['email']} already exists")
            else:
                await db.insert('users', user)
                print(f"   ✓ Created user: {user['email']}")
        except Exception as e:
            print(f"   ✗ Error creating user {user['email']}: {e}")
    
    # Get created users for property ownership
    seller_user = await db.admin_select('users', filters={'email': 'seller@homeandown.com'})
    seller_id = seller_user[0]['id'] if seller_user else None
    
    # Create sample properties
    properties_data = [
        {
            'id': str(uuid.uuid4()),
            'title': 'Modern 3BHK Apartment in Gachibowli',
            'description': 'Beautiful spacious 3BHK apartment with modern amenities, perfect for families. Located in the heart of Gachibowli with easy access to IT companies and shopping centers.',
            'property_type': 'gated_apartment',
            'listing_type': 'SALE',
            'price': 8500000,
            'bedrooms': 3,
            'bathrooms': 2,
            'balconies': 2,
            'area_sqft': 1850,
            'built_up_area_sqft': 1850,
            'address': 'Gachibowli, Hyderabad',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'state_id': 'Telangana',
            'zip_code': '500032',
            'latitude': 17.4435,
            'longitude': 78.3772,
            'owner_id': seller_id,
            'status': 'active',
            'verified': True,
            'featured': True,
            'floor': 5,
            'total_floors': 12,
            'facing': 'East',
            'furnishing_status': 'Semi Furnished',
            'amenities': ['Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup', 'Clubhouse'],
            'images': [
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
            ],
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Luxury Villa in Jubilee Hills',
            'description': 'Stunning 4BHK independent villa with private garden and parking. Premium location with excellent connectivity.',
            'property_type': 'villa',
            'listing_type': 'SALE',
            'price': 25000000,
            'bedrooms': 4,
            'bathrooms': 4,
            'area_sqft': 3500,
            'plot_area_sqft': 5000,
            'built_up_area_sqft': 3500,
            'address': 'Jubilee Hills, Hyderabad',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'state_id': 'Telangana',
            'zip_code': '500033',
            'latitude': 17.4319,
            'longitude': 78.4073,
            'owner_id': seller_id,
            'status': 'active',
            'verified': True,
            'featured': True,
            'floor_count': 2,
            'facing': 'North',
            'private_garden': True,
            'private_driveway': True,
            'furnishing_status': 'Fully Furnished',
            'amenities': ['Garden', 'Parking', 'Security', 'Power Backup', 'Modular Kitchen'],
            'images': [
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
            ],
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '2BHK Apartment for Rent in Kondapur',
            'description': 'Well-maintained 2BHK apartment available for rent. Close to schools, hospitals, and IT parks.',
            'property_type': 'standalone_apartment',
            'listing_type': 'RENT',
            'monthly_rent': 25000,
            'security_deposit': 50000,
            'maintenance_charges': 2000,
            'bedrooms': 2,
            'bathrooms': 2,
            'balconies': 1,
            'area_sqft': 1200,
            'carpet_area_sqft': 1000,
            'address': 'Kondapur, Hyderabad',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'state_id': 'Telangana',
            'zip_code': '500084',
            'latitude': 17.4618,
            'longitude': 78.3609,
            'owner_id': seller_id,
            'status': 'active',
            'verified': True,
            'floor': 3,
            'total_floors': 8,
            'facing': 'South',
            'furnishing_status': 'Unfurnished',
            'amenities': ['Parking', 'Lift', 'Security', 'Water Supply'],
            'images': [
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
            ],
            'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
            'updated_at': dt.datetime.now(dt.timezone.utc).isoformat()
        }
    ]
    
    print("🏠 Creating sample properties...")
    property_ids = []
    for prop in properties_data:
        try:
            # Check if property exists
            existing = await db.admin_select('properties', filters={'title': prop['title']})
            if existing:
                print(f"   ✓ Property '{prop['title']}' already exists")
                property_ids.append(existing[0]['id'])
            else:
                await db.insert('properties', prop)
                print(f"   ✓ Created property: {prop['title']}")
                property_ids.append(prop['id'])
        except Exception as e:
            print(f"   ✗ Error creating property '{prop['title']}': {e}")
    
    print("\n✅ Test data seeding completed!")
    print(f"   - Users created: {len(users_data)}")
    print(f"   - Properties created: {len(properties_data)}")
    print("\n🔐 Test Credentials:")
    print("   Buyer: buyer@homeandown.com / password123")
    print("   Seller: seller@homeandown.com / password123")
    print("   Agent: agent@homeandown.com / password123")
    print("   Admin: admin@homeandown.com / Frisco@2025")

if __name__ == '__main__':
    asyncio.run(seed_data())
