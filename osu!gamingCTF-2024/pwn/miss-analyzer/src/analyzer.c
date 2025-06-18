#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <math.h>

#define MIN(a,b) (((a)<(b))?(a):(b))

int hexchr2bin(const char hex, char *out)
{
	if (out == NULL)
		return 0;

	if (hex >= '0' && hex <= '9') {
		*out = hex - '0';
	} else if (hex >= 'A' && hex <= 'F') {
		*out = hex - 'A' + 10;
	} else if (hex >= 'a' && hex <= 'f') {
		*out = hex - 'a' + 10;
	} else {
		return 0;
	}

	return 1;
}

size_t hexs2bin(const char *hex, unsigned char **out)
{
	size_t len;
	char   b1;
	char   b2;
	size_t i;

	if (hex == NULL || *hex == '\0' || out == NULL) {
        return 0;
    }

	len = strlen(hex);
	if (len % 2 != 0) {
		return 0;
    }
	len /= 2;

	*out = malloc(len);
	memset(*out, 'A', len);
	for (i=0; i<len; i++) {
		if (!hexchr2bin(hex[i*2], &b1) || !hexchr2bin(hex[i*2+1], &b2)) {
			return 0;
		}
		(*out)[i] = (b1 << 4) | b2;
	}
	return len;
}

char read_byte(unsigned char** data, size_t* length) {
    if (*length == 0) {
        printf("Error: failed to read replay\n");
        exit(1);
    }
    char c = **data;
    (*data)++;
    (*length)--;
    return c;
}

short read_short(unsigned char** data, size_t* length) {
    short a = (short) read_byte(data, length);
    short b = (short) read_byte(data, length);
    return b * pow(2, 8) + a;
}

void read_string(unsigned char** data, size_t* length, char* buffer, int max_length) {
    buffer[0] = 0;

    char marker = read_byte(data, length);
    if (marker == 0x0) { return; }
    if (marker != 0x0b) {
        printf("Error: failed to read string\n");
        exit(1);
    }

    unsigned int len = 0, shift = 0;
    while (true) {
        char byte = read_byte(data, length);
        len = len | ((byte & 0b01111111) << shift);
        if ((byte & 0b10000000) == 0x00) {
            break;
        }
        shift += 7;
    }

    int i = 0;
    for (; i < MIN(max_length, len); i++) {
        buffer[i] = read_byte(data, length);
    }
    for (; i < len; i++) {
        read_byte(data, length);
    }

    buffer[MIN(max_length, len)] = 0;
}

void consume_bytes(unsigned char** data, size_t* length, int n) {
    for (int i = 0; i < n; i++) {
        read_byte(data, length);
    }
}

int main(int argc, char* argv[] ) {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);

    while (true) {
        printf("Submit replay as hex (use xxd -p -c0 replay.osr | ./analyzer):\n");

        char* replay_hex = NULL;
        size_t size_hex = 0;
        if (getline(&replay_hex, &size_hex, stdin) <= 0) {
            break;
        }
        replay_hex[strcspn(replay_hex, "\n")] = 0;

        if (strlen(replay_hex) == 0) {
            break;
        }

        unsigned char* replay_start;
        size_t size = hexs2bin(replay_hex, &replay_start);
        unsigned char* replay = replay_start;

        if (size == 0) {
            printf("Error: failed to decode hex\n");
            return 1;
        }

        printf("\n=~= miss-analyzer =~=\n");
        char mode = read_byte(&replay, &size);
        if (mode == 0) {
            printf("Mode: osu!\n");
        }
        else if (mode == 1) {
            printf("Mode: osu!taiko\n");
        }
        else if (mode == 2) {
            printf("Mode: osu!catch\n");
        }
        else if (mode == 3) {
            printf("Mode: osu!mania\n");
        }

        consume_bytes(&replay, &size, 4);

        char data[256];
        read_string(&replay, &size, data, sizeof(data) - 1);
        printf("Hash: %s\n", data);

        read_string(&replay, &size, data, sizeof(data) - 1);
        printf("Player name: ");
        printf(data);
        printf("\n");

        read_string(&replay, &size, data, sizeof(data) - 1);

        consume_bytes(&replay, &size, 10);

        short n_misses = read_short(&replay, &size);
        printf("Miss count: %d\n", n_misses);

        if (n_misses == 0) {
            printf("You didn't miss!\n");
        }
        else {
            printf("Yep, looks like you missed.\n");
        }
        printf("=~=~=~=~=~=~=~=~=~=~=\n\n");

        free(replay_hex);
        free(replay_start);
    }

    return 0;
}