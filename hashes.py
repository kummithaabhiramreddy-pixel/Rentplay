import hashlib

text="hello"

hashed=hashlib.sha3_256(text.encode()).hexdigest

print(hashed)