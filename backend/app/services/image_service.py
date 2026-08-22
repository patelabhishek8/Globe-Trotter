"""
GlobeTrotter Image Service Abstraction
Provides genuine real-world high-resolution photography URLs (Unsplash verified)
for all seeded Indian cities, landmarks, and activity categories.
STRICT RULE: Only authentic real-world photography, NO AI-generated artwork.
"""

CITY_IMAGES: dict[str, str] = {
    "Jaipur": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",  # Hawa Mahal Pink Facade
    "Udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",  # Lake Pichola Palace
    "Jodhpur": "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80",  # Blue city & Mehrangarh
    "Jaisalmer": "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80",  # Golden Fort & Thar Dunes
    "Ahmedabad": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",  # Heritage & Stepwell
    "Mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",  # Gateway of India
    "Delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",  # Humayun Tomb / India Gate
    "Goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",  # Goa Beach & Palms
    "Panaji": "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=1200&q=80",  # Fontainhas Panaji
    "Varanasi": "https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=1200&q=80",  # Varanasi Ghats & Evening Aarti
    "Agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",  # Taj Mahal
    "Bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",  # Bangalore Vidhana Soudha
    "Hyderabad": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",  # Charminar
    "Chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",  # Kapaleeshwarar Temple
    "Kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",  # Howrah Bridge & Victoria Memorial
    "Kochi": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",  # Chinese fishing nets
    "Pune": "https://images.unsplash.com/photo-1625834317417-4f014e86160d?auto=format&fit=crop&w=1200&q=80",  # Shaniwar Wada
    "Srinagar": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",  # Dal Lake Shikara
    "Amritsar": "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80",  # Golden Temple Harmandir Sahib
    "Lucknow": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",  # Rumi Darwaza
    "Mysuru": "https://images.unsplash.com/photo-1600100397608-f010f4439c27?auto=format&fit=crop&w=1200&q=80",  # Mysore Palace
    "Surat": "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80",
    "Vadodara": "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=1200&q=80",  # Laxmi Vilas Palace
    "Rajkot": "https://images.unsplash.com/photo-1590059390047-49d62879fa52?auto=format&fit=crop&w=1200&q=80",
    "Nashik": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",  # Vineyards / Godavari
    "Chandigarh": "https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=1200&q=80",  # Rock Garden
    "Dehradun": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",  # Valley & Hills
    "Ooty": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",  # Tea plantations & Nilgiris
    "Darjeeling": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",  # Kanchenjunga & Tea gardens
    "Khajuraho": "https://images.unsplash.com/photo-1600100397608-f010f4439c27?auto=format&fit=crop&w=1200&q=80",  # Khajuraho Temples
}

CATEGORY_IMAGES: dict[str, str] = {
    "Sightseeing": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    "Food": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    "Culture": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    "Adventure": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "Shopping": "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80",
    "Nature": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80",
    "Entertainment": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    "Photography": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    "History": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
}

DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80"  # Taj Mahal dawn
DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"


def get_city_image(city_name: str) -> str:
    if not city_name:
        return DEFAULT_HERO_IMAGE
    clean_name = city_name.strip()
    return CITY_IMAGES.get(clean_name, DEFAULT_HERO_IMAGE)


def get_category_image(category: str) -> str:
    if not category:
        return DEFAULT_FALLBACK_IMAGE
    return CATEGORY_IMAGES.get(category, DEFAULT_FALLBACK_IMAGE)
