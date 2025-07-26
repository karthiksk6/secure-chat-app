from client_crypto import ClientCrypto

alice = ClientCrypto()
bob = ClientCrypto()

alice_pub = alice.get_public_key_pem()
bob_pub = bob.get_public_key_pem()

# Alice encrypts a message for Bob
payload = alice.encrypt_message("This is a secret!", bob_pub)

# Bob decrypts
plaintext = bob.decrypt_message(payload)

print("[✓] Decrypted message:", plaintext)
