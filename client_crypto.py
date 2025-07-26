from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import os
import base64

class ClientCrypto:
    def __init__(self):
        # Generate RSA keys
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()

    def get_public_key_pem(self):
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def encrypt_message(self, message: str, recipient_public_key_pem: bytes):
        # Generate AES key
        aes_key = os.urandom(32)
        iv = os.urandom(16)

        # Encrypt message with AES
        cipher = Cipher(algorithms.AES(aes_key), modes.CFB(iv))
        encryptor = cipher.encryptor()
        encrypted_message = encryptor.update(message.encode()) + encryptor.finalize()

        # Encrypt AES key with recipient's RSA public key
        recipient_public_key = serialization.load_pem_public_key(recipient_public_key_pem)
        encrypted_aes_key = recipient_public_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        return {
            "aes_iv": base64.b64encode(iv).decode(),
            "aes_key_encrypted": base64.b64encode(encrypted_aes_key).decode(),
            "cipher_text": base64.b64encode(encrypted_message).decode()
        }

    def decrypt_message(self, encrypted_dict):
        encrypted_key = base64.b64decode(encrypted_dict["aes_key_encrypted"])
        iv = base64.b64decode(encrypted_dict["aes_iv"])
        cipher_text = base64.b64decode(encrypted_dict["cipher_text"])

        # Decrypt AES key with private RSA key
        aes_key = self.private_key.decrypt(
            encrypted_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Decrypt message
        cipher = Cipher(algorithms.AES(aes_key), modes.CFB(iv))
        decryptor = cipher.decryptor()
        decrypted_message = decryptor.update(cipher_text) + decryptor.finalize()

        return decrypted_message.decode()
