import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB = os.getenv("MONGODB_DB")

client = MongoClient(MONGODB_URL)

db = client[MONGODB_DB]

projects_collection = db["projects"]