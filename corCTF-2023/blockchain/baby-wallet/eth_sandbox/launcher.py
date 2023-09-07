import json
import os
import random
import string
import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional
from uuid import UUID

import requests
from eth_account import Account
from web3 import Web3
from web3.exceptions import TransactionNotFound
from web3.types import TxReceipt

from eth_sandbox import get_shared_secret

import binascii
import datetime
import pow
import sys
import os

HTTP_PORT = os.getenv("HTTP_PORT", "8545")
RPC_ENDPOINT = os.getenv("RPC_ENDPOINT", "http://127.0.0.1:8545")

CHALLENGE_ID = os.getenv("CHALLENGE_ID", "challenge")
ENV = os.getenv("ENV", "dev")
FLAG = os.getenv("FLAG", "PCTF{placeholder}")

Account.enable_unaudited_hdwallet_features()

@dataclass
class Ticket:
    ticket_str: string
    challenge_id: string
    team_id: string
    status: string
    time: float

@dataclass
class Action:
    name: str
    handler: Callable[[], int]

def change_ticket_status(ticket_str, status):
    with open(f"/tmp/tickets/{ticket_str}", "r") as f:
        ticket = json.loads(f.read())
    ticket["status"] = status
    with open(f"/tmp/tickets/{ticket_str}", "w") as f:
        f.write(json.dumps(ticket))

def get_ticket_action():
    def action() -> int:
        challenge = pow.get_challenge(20000)
        sys.stdout.write("== proof-of-work: enabled ==\n")
        sys.stdout.write("please solve a pow\n")
        sys.stdout.write("You can run the solver with:\n")
        sys.stdout.write("    python3 <(curl -sSL {}) solve {}\n".format(pow.SOLVER_URL, challenge))
        sys.stdout.write("============================\n")
        sys.stdout.write("\n")
        sys.stdout.flush()
        solution = input("solution: ")

        if pow.verify_challenge(challenge, solution):
            ticket = "ticket{" + binascii.b2a_hex(os.urandom(16)).decode() + "}"
            with open(f"/tmp/tickets/{ticket}", "w") as f:
                f.write(json.dumps({
                    "ticket_str": ticket,
                    "challenge_id": CHALLENGE_ID,
                    "team_id": binascii.b2a_hex(os.urandom(16)).decode(),
                    "status": "ready",
                    "time": time.time()
                }))
            print(f"here's your ticket: {ticket}")
            print(f"the ticket will last for 45 minutes")
        else:
            sys.stdout.write("Proof-of-work fail")
            sys.stdout.flush()
            return 1

        return 0
    return Action(name="get a ticket", handler=action)

def check_ticket(ticket_str: str) -> Ticket:
    if "." in ticket_str or "/" in ticket_str or not ticket_str.startswith("ticket{") or not ticket_str.endswith("}"):
        # nice try, no path traversal here
        return None

    try:
        with open(f"/tmp/tickets/{ticket_str}", "r") as f:
            data = json.loads(f.read())
        if time.time() > data["time"] + 2700: # expired, 2700 = 45 minutes in seconds
            os.remove(f"/tmp/tickets/{ticket_str}")
            return None
        return Ticket(
            ticket_str=data["ticket_str"],
            challenge_id=data["challenge_id"],
            team_id=data["team_id"],
            status=data["status"],
            time=data["time"]
        )
    except:
        return None

def sendTransaction(web3: Web3, tx: Dict) -> Optional[TxReceipt]:
    if "gas" not in tx:
        tx["gas"] = 10_000_000

    if "gasPrice" not in tx:
        tx["gasPrice"] = 0

    # web3.provider.make_request("anvil_impersonateAccount", [tx["from"]])
    txhash = web3.eth.sendTransaction(tx)
    # web3.provider.make_request("anvil_stopImpersonatingAccount", [tx["from"]])

    while True:
        try:
            rcpt = web3.eth.getTransactionReceipt(txhash)
            break
        except TransactionNotFound:
            time.sleep(0.1)

    if rcpt.status != 1:
        raise Exception("failed to send transaction")

    return rcpt


def new_launch_instance_action(
    do_deploy: Callable[[Web3, str], str],
):
    def action() -> int:
        ticket = check_ticket(input("ticket please: "))
        if not ticket:
            print("invalid ticket!")
            return 1

        if ticket.challenge_id != CHALLENGE_ID:
            print("invalid ticket!")
            return 1

        if ticket.status != "ready":
            print("the instance has already been launched!")
            return 1

        data = requests.post(
            f"http://127.0.0.1:{HTTP_PORT}/new",
            headers={
                "Authorization": f"Bearer {get_shared_secret()}",
                "Content-Type": "application/json",
            },
            data=json.dumps(
                {
                    "team_id": ticket.team_id,
                }
            ),
        ).json()

        if data["ok"] == False:
            print(data["message"])
            return 1

        uuid = data["uuid"]
        mnemonic = data["mnemonic"]
        
        deployer_acct = Account.from_mnemonic(mnemonic, account_path=f"m/44'/60'/0'/0/0")
        player_acct = Account.from_mnemonic(mnemonic, account_path=f"m/44'/60'/0'/0/1")

        web3 = Web3(Web3.HTTPProvider(
            f"http://127.0.0.1:{HTTP_PORT}/{uuid}",
            request_kwargs={
                "headers": {
                    "Authorization": f"Bearer {get_shared_secret()}",
                    "Content-Type": "application/json",
                },
            },
        ))

        setup_addr = do_deploy(web3, deployer_acct.address, player_acct.address)

        with open(f"/tmp/{ticket.team_id}", "w") as f:
            f.write(
                json.dumps(
                    {
                        "uuid": uuid,
                        "mnemonic": mnemonic,
                        "address": setup_addr,
                    }
                )
            )

        change_ticket_status(ticket.ticket_str, "deployed")

        print()
        print(f"your private blockchain has been deployed")
        print(f"it will automatically terminate in 30 minutes")
        print(f"here's some useful information")
        print(f"uuid:           {uuid}")
        print(f"rpc endpoint:   {RPC_ENDPOINT}/{uuid}")
        print(f"private key:    {player_acct.privateKey.hex()}")
        print(f"your address:   {player_acct.address}")
        print(f"setup contract: {setup_addr}")
        return 0

    return Action(name="launch new instance", handler=action)


def new_kill_instance_action():
    def action() -> int:
        ticket = check_ticket(input("ticket please: "))
        if not ticket:
            print("invalid ticket!")
            return 1

        if ticket.challenge_id != CHALLENGE_ID:
            print("invalid ticket!")
            return 1

        if ticket.status != "deployed":
            print("your instance has not been deployed!")
            return 1

        data = requests.post(
            f"http://127.0.0.1:{HTTP_PORT}/kill",
            headers={
                "Authorization": f"Bearer {get_shared_secret()}",
                "Content-Type": "application/json",
            },
            data=json.dumps(
                {
                    "team_id": ticket.team_id,
                }
            ),
        ).json()

        print(data["message"])
        change_ticket_status(ticket.ticket_str, "ready")
        return 1

    return Action(name="kill instance", handler=action)

def is_solved_checker(web3: Web3, addr: str) -> bool:
    result = web3.eth.call(
        {
            "to": addr,
            "data": web3.sha3(text="isSolved()")[:4],
        }
    )
    return int(result.hex(), 16) == 1


def new_get_flag_action(
    checker: Callable[[Web3, str], bool] = is_solved_checker,
):
    def action() -> int:
        ticket = check_ticket(input("ticket please: "))
        if not ticket:
            print("invalid ticket!")
            return 1

        if ticket.challenge_id != CHALLENGE_ID:
            print("invalid ticket!")
            return 1

        if ticket.status != "deployed":
            print("your instance has not been deployed!")
            return 1

        try:
            with open(f"/tmp/{ticket.team_id}", "r") as f:
                data = json.loads(f.read())
        except:
            print("bad ticket")
            return 1

        web3 = Web3(Web3.HTTPProvider(f"http://127.0.0.1:{HTTP_PORT}/{data['uuid']}"))

        if not checker(web3, data['address']):
            print("are you sure you solved it?")
            return 1

        print(FLAG)
        return 0

    return Action(name="get flag", handler=action)


def run_launcher(actions: List[Action]):
    for i, action in enumerate(actions):
        print(f"{i+1} - {action.name}")

    action = int(input("action? ")) - 1
    if action < 0 or action >= len(actions):
        print("can you not")
        exit(1)

    exit(actions[action].handler())
