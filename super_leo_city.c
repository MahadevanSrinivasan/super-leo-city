/*
 * SUPER LEO CITY: HERO PATROL & STUNT SANDBOX (Native SDL2 60FPS Edition)
 * Wholesome, non-violent open-world driving & rescue sandbox for kids!
 * Uses single streaming SDL_Texture (384x216 -> GPU scaled to 1280x720)
 * for locked 60 FPS on Raspberry Pi 1 & Xubuntu Linux.
 */

#include <SDL2/SDL.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define REN_W 384
#define REN_H 216
#define WORLD_W 2400.0f
#define WORLD_H 2400.0f
#define MAX_VEHICLES 12
#define MAX_BUILDINGS 10
#define MAX_RAMPS 8
#define MAX_PROPS 20
#define MAX_PROJ 24
#define MAX_TARGETS 4

typedef struct {
    Uint8 r, g, b;
} Color;

static Color rgb(int r, int g, int b) {
    Color c = {(Uint8)r, (Uint8)g, (Uint8)b};
    return c;
}

enum {
    V_SPORTS = 0,
    V_FIRE,
    V_POLICE,
    V_ICECREAM,
    V_PIZZA,
    V_MONSTER,
    V_BOAT,
    V_HELI,
    V_DINO
};

typedef struct {
    int id;
    const char *name;
    int w, h;
    float max_spd, accel, turn;
    Color col, stripe;
    int siren, can_fly, can_swim, monster;
} VehDef;

static const VehDef VDEFS[9] = {
    {V_SPORTS,   "COMET GT",       22, 12, 5.2f, 0.22f, 0.08f, {239,68,68},   {255,255,255}, 0, 0, 0, 0},
    {V_FIRE,     "FIRE ENGINE",    28, 14, 4.1f, 0.16f, 0.06f, {220,38,38},   {250,204,21},  1, 0, 0, 0},
    {V_POLICE,   "HERO CRUISER",   22, 12, 4.8f, 0.20f, 0.07f, {29,78,216},   {248,250,252}, 1, 0, 0, 0},
    {V_ICECREAM, "ICE CREAM VAN",  24, 14, 3.9f, 0.15f, 0.06f, {244,114,182}, {56,189,248},  0, 0, 0, 0},
    {V_PIZZA,    "PIZZA BUGGY",    20, 12, 4.6f, 0.20f, 0.08f, {249,115,22},  {253,224,71},  0, 0, 0, 0},
    {V_MONSTER,  "MONSTER TRUCK",  26, 16, 4.3f, 0.18f, 0.07f, {139,92,246},  {74,222,128},  0, 0, 0, 1},
    {V_BOAT,     "SPEEDBOAT",      25, 13, 5.0f, 0.20f, 0.07f, {6,182,212},   {255,255,255}, 0, 0, 1, 0},
    {V_HELI,     "RESCUE HELI",    24, 14, 5.5f, 0.22f, 0.08f, {245,158,11},  {255,255,255}, 0, 1, 1, 0},
    {V_DINO,     "EMERALD REX",    22, 14, 4.5f, 0.22f, 0.09f, {16,185,129},  {239,68,68},   0, 0, 1, 0}
};

typedef struct {
    float x, y, w, h;
    Color roof, wall;
    const char *label;
} Building;

static const Building BUILDINGS[MAX_BUILDINGS] = {
    {260,  260,  200, 150, {59,130,246},  {29,78,216},  "CITY HALL"},
    {640,  260,  190, 150, {239,68,68},   {185,28,28},  "FIRE HQ"},
    {1020, 260,  200, 150, {37,99,235},   {30,64,175},  "POLICE HQ"},
    {260,  640,  200, 160, {249,115,22},  {194,65,12},  "PIZZERIA"},
    {1020, 640,  200, 160, {236,72,153},  {190,24,93},  "ICE CREAM"},
    {260,  1040, 200, 160, {139,92,246},  {91,33,182},  "ROBOT LAB"},
    {640,  1040, 190, 160, {20,184,166},  {15,118,110}, "ARCADE"},
    {1020, 1040, 200, 160, {234,179,8},   {161,98,7},   "MONSTER HQ"},
    {1460, 260,  210, 140, {2,132,199},   {3,105,161},  "AIRPORT"},
    {1460, 1040, 200, 140, {22,163,74},   {21,128,61},  "DINO PARK"}
};

typedef struct {
    float x, y, w, h;
} Ramp;

static const Ramp RAMPS[MAX_RAMPS] = {
    {530,  500,  56, 34},
    {920,  500,  56, 34},
    {530,  900,  56, 34},
    {1300, 560,  68, 38},
    {1300, 950,  68, 38},
    {1780, 460,  46, 72},
    {1780, 780,  46, 72},
    {740,  1400, 68, 38}
};

typedef struct {
    const VehDef *def;
    float x, y, speed, angle, z, vz;
    int ai_patrol;
} Vehicle;

typedef struct {
    int active;
    float x, y, vx, vy;
    Color col;
    int life;
} Proj;

typedef struct {
    float x, y, vx, vy;
    int hp, done;
} Target;

static SDL_Window *window = NULL;
static SDL_Renderer *renderer = NULL;
static SDL_Texture *screen_tex = NULL;
static Uint32 fb[REN_W * REN_H];

static Vehicle vehicles[MAX_VEHICLES];
static Proj projs[MAX_PROJ];
static Target targets[MAX_TARGETS];

static int game_state = 0; /* 0=title, 1=playing */
static int tick = 0;
static int score = 0;
static int coins = 0;
static int mission_idx = 0;
static int mission_prog = 0;
static int mission_goal = 3;
static char banner[64] = "PRESS E OR ENTER NEAR ANY VEHICLE TO DRIVE!";
static int banner_timer = 200;

static struct {
    float x, y, angle, z;
    int veh_idx; /* -1 = on foot */
    int nitro_timer;
} player = {600.0f, 490.0f, 0.0f, 0.0f, -1, 0};

static float cam_x = 400.0f, cam_y = 350.0f;
static float ball_x = 735.0f, ball_y = 720.0f, ball_vx = 0.0f, ball_vy = 0.0f;

static Uint8 keys_held[SDL_NUM_SCANCODES];
static Uint8 prev_held[SDL_NUM_SCANCODES];
static int just_pressed(SDL_Scancode sc) { return keys_held[sc] && !prev_held[sc]; }

/* Audio Synthesizer */
static volatile float beep_freq = 0.0f;
static volatile int beep_timer = 0;
static float beep_phase = 0.0f;

static void play_tone(float freq, int samples) {
    SDL_LockAudio();
    beep_freq = freq;
    beep_timer = samples;
    SDL_UnlockAudio();
}

static void audio_cb(void *userdata, Uint8 *stream, int len) {
    (void)userdata;
    Sint16 *buf = (Sint16 *)stream;
    int n = len / 2;
    for (int i = 0; i < n; i++) {
        int v = 0;
        if (beep_timer > 0 && beep_freq > 20.0f) {
            beep_phase += beep_freq / 22050.0f;
            if (beep_phase >= 1.0f) beep_phase -= 1.0f;
            v = (beep_phase < 0.5f) ? 2000 : -2000;
            beep_timer--;
        }
        buf[i] = (Sint16)v;
    }
}

/* 5x7 Pixel Font */
static const unsigned char font5x7[96][7] = {
    [' ' - 32] = {0,0,0,0,0,0,0},
    ['!' - 32] = {4,4,4,4,4,0,4},
    ['+' - 32] = {0,4,4,31,4,4,0},
    ['-' - 32] = {0,0,0,31,0,0,0},
    ['.' - 32] = {0,0,0,0,0,0,4},
    ['/' - 32] = {1,1,2,4,8,16,16},
    ['0' - 32] = {14,17,19,21,25,17,14},
    ['1' - 32] = {4,12,4,4,4,4,14},
    ['2' - 32] = {14,17,1,6,8,16,31},
    ['3' - 32] = {31,2,4,6,1,17,14},
    ['4' - 32] = {2,6,10,18,31,2,2},
    ['5' - 32] = {31,16,30,1,1,17,14},
    ['6' - 32] = {6,8,16,30,17,17,14},
    ['7' - 32] = {31,1,2,4,8,8,8},
    ['8' - 32] = {14,17,17,14,17,17,14},
    ['9' - 32] = {14,17,17,15,1,2,12},
    [':' - 32] = {0,4,4,0,4,4,0},
    ['A' - 32] = {14,17,17,31,17,17,17},
    ['B' - 32] = {30,17,17,30,17,17,30},
    ['C' - 32] = {14,17,16,16,16,17,14},
    ['D' - 32] = {28,18,17,17,17,18,28},
    ['E' - 32] = {31,16,16,30,16,16,31},
    ['F' - 32] = {31,16,16,30,16,16,16},
    ['G' - 32] = {14,17,16,23,17,17,15},
    ['H' - 32] = {17,17,17,31,17,17,17},
    ['I' - 32] = {14,4,4,4,4,4,14},
    ['J' - 32] = {7,2,2,2,2,18,12},
    ['K' - 32] = {17,18,20,24,20,18,17},
    ['L' - 32] = {16,16,16,16,16,16,31},
    ['M' - 32] = {17,27,21,21,17,17,17},
    ['N' - 32] = {17,17,25,21,19,17,17},
    ['O' - 32] = {14,17,17,17,17,17,14},
    ['P' - 32] = {30,17,17,30,16,16,16},
    ['Q' - 32] = {14,17,17,17,21,18,13},
    ['R' - 32] = {30,17,17,30,20,18,17},
    ['S' - 32] = {15,16,16,14,1,1,30},
    ['T' - 32] = {31,4,4,4,4,4,4},
    ['U' - 32] = {17,17,17,17,17,17,14},
    ['V' - 32] = {17,17,17,17,17,10,4},
    ['W' - 32] = {17,17,17,21,21,21,10},
    ['X' - 32] = {17,17,10,4,10,17,17},
    ['Y' - 32] = {17,17,17,10,4,4,4},
    ['Z' - 32] = {31,1,2,4,8,16,31}
};

static inline void fill_rect(int x, int y, int w, int h, Color c) {
    int x0 = x < 0 ? 0 : x;
    int y0 = y < 0 ? 0 : y;
    int x1 = (x + w) > REN_W ? REN_W : (x + w);
    int y1 = (y + h) > REN_H ? REN_H : (y + h);
    if (x0 >= x1 || y0 >= y1) return;
    Uint32 pix = 0xFF000000u | ((Uint32)c.r << 16) | ((Uint32)c.g << 8) | (Uint32)c.b;
    for (int ry = y0; ry < y1; ry++) {
        Uint32 *row = &fb[ry * REN_W + x0];
        for (int rx = x0; rx < x1; rx++) *row++ = pix;
    }
}

static void draw_text(int x, int y, const char *s, Color col, int scale) {
    int cx = x;
    while (*s) {
        char c = *s++;
        if (c >= 'a' && c <= 'z') c -= 32;
        if (c > 32 && c < 128) {
            const unsigned char *g = font5x7[c - 32];
            for (int r = 0; r < 7; r++) {
                unsigned char bits = g[r];
                if (!bits) continue;
                for (int ci = 0; ci < 5; ci++) {
                    if (bits & (1 << (4 - ci))) {
                        fill_rect(cx + ci * scale, y + r * scale, scale, scale, col);
                    }
                }
            }
        }
        cx += 6 * scale;
    }
}

static void start_mission(int idx) {
    mission_idx = idx % 4;
    mission_prog = 0;
    mission_goal = 3;
    targets[0] = (Target){500.0f, 600.0f, 1.8f, 0.0f, 10, 0};
    targets[1] = (Target){940.0f, 470.0f, 0.0f, 1.8f, 10, 0};
    targets[2] = (Target){930.0f, 960.0f, -1.8f, 1.2f, 10, 0};
    const char *names[4] = {
        "MISSION 1: SPRAY 3 FIRES WITH Z!",
        "MISSION 2: DELIVER 3 PIZZAS!",
        "MISSION 3: ICE CREAM PARTY!",
        "MISSION 4: TAG 3 ROBO-PUPS!"
    };
    snprintf(banner, sizeof(banner), "%s", names[mission_idx]);
    banner_timer = 180;
}

static void init_city(void) {
    vehicles[0]  = (Vehicle){&VDEFS[V_SPORTS],   620,  460, 0, 0, 0, 0, 0};
    vehicles[1]  = (Vehicle){&VDEFS[V_FIRE],     740,  460, 0, 0, 0, 0, 0};
    vehicles[2]  = (Vehicle){&VDEFS[V_POLICE],   1120, 460, 0, 0, 0, 0, 0};
    vehicles[3]  = (Vehicle){&VDEFS[V_PIZZA],    380,  860, 0, 0, 0, 0, 0};
    vehicles[4]  = (Vehicle){&VDEFS[V_ICECREAM], 1120, 860, 0, 0, 0, 0, 0};
    vehicles[5]  = (Vehicle){&VDEFS[V_MONSTER],  1120, 1250,0, 0, 0, 0, 0};
    vehicles[6]  = (Vehicle){&VDEFS[V_HELI],     1860, 360, 0, 0, 0, 0, 0};
    vehicles[7]  = (Vehicle){&VDEFS[V_BOAT],     900,  1740,0, 0, 0, 0, 0};
    vehicles[8]  = (Vehicle){&VDEFS[V_DINO],     1580, 1250,0, 0, 0, 0, 0};
    vehicles[9]  = (Vehicle){&VDEFS[V_SPORTS],   520,  860, 2.0f, 0, 0, 0, 1};
    vehicles[10] = (Vehicle){&VDEFS[V_ICECREAM], 900,  600, 2.0f, 1.57f, 0, 0, 1};
    vehicles[11] = (Vehicle){&VDEFS[V_POLICE],   1260, 860, 2.0f, -1.57f, 0, 0, 1};
    start_mission(0);
}

static int is_water(float x, float y) {
    if (y > 1640.0f) return 1;
    if (x > 1340.0f && x < 1420.0f && y < 1640.0f) {
        if ((y > 540.0f && y < 630.0f) || (y > 930.0f && y < 1020.0f)) return 0;
        return 1;
    }
    return 0;
}

static void update_game(void) {
    tick++;
    if (banner_timer > 0) banner_timer--;

    if (just_pressed(SDL_SCANCODE_E) || just_pressed(SDL_SCANCODE_RETURN) || just_pressed(SDL_SCANCODE_X)) {
        if (player.veh_idx >= 0) {
            Vehicle *v = &vehicles[player.veh_idx];
            v->speed = 0;
            player.x = v->x;
            player.y = v->y + 24.0f;
            player.z = 0;
            player.veh_idx = -1;
            play_tone(440.0f, 2000);
            snprintf(banner, sizeof(banner), "ON FOOT! PRESS E/ENTER BY ANY CAR TO HOP IN!");
            banner_timer = 150;
        } else {
            int best = -1;
            float best_d = 48.0f;
            for (int i = 0; i < MAX_VEHICLES; i++) {
                float d = hypotf(vehicles[i].x - player.x, vehicles[i].y - player.y);
                if (d < best_d) { best_d = d; best = i; }
            }
            if (best >= 0) {
                player.veh_idx = best;
                vehicles[best].ai_patrol = 0;
                play_tone(660.0f, 3000);
                snprintf(banner, sizeof(banner), "DRIVING %s! Z=ACTION SPACE=NITRO", vehicles[best].def->name);
                banner_timer = 160;
            }
        }
    }

    float dx = 0.0f, dy = 0.0f;
    if (keys_held[SDL_SCANCODE_LEFT]  || keys_held[SDL_SCANCODE_A]) dx -= 1.0f;
    if (keys_held[SDL_SCANCODE_RIGHT] || keys_held[SDL_SCANCODE_D]) dx += 1.0f;
    if (keys_held[SDL_SCANCODE_UP]    || keys_held[SDL_SCANCODE_W]) dy -= 1.0f;
    if (keys_held[SDL_SCANCODE_DOWN]  || keys_held[SDL_SCANCODE_S]) dy += 1.0f;

    if (keys_held[SDL_SCANCODE_Z] && (tick % 6 == 0)) {
        for (int i = 0; i < MAX_PROJ; i++) {
            if (!projs[i].active) {
                projs[i].active = 1;
                projs[i].x = player.x + cosf(player.angle) * 14.0f;
                projs[i].y = player.y + sinf(player.angle) * 14.0f;
                projs[i].vx = cosf(player.angle) * 6.5f;
                projs[i].vy = sinf(player.angle) * 6.5f;
                projs[i].col = rgb(56, 189, 248);
                projs[i].life = 28;
                play_tone(520.0f, 900);
                break;
            }
        }
    }

    if (player.veh_idx >= 0) {
        Vehicle *v = &vehicles[player.veh_idx];
        const VehDef *d = v->def;
        if (dx != 0.0f || dy != 0.0f) {
            float tang = atan2f(dy, dx);
            float diff = tang - v->angle;
            while (diff > 3.14159f) diff -= 6.28318f;
            while (diff < -3.14159f) diff += 6.28318f;
            v->angle += diff * 0.25f;
            float top = d->max_spd * (keys_held[SDL_SCANCODE_SPACE] ? 1.35f : 1.0f);
            v->speed += d->accel;
            if (v->speed > top) v->speed = top;
        } else {
            v->speed *= 0.90f;
        }
        if (d->can_fly) {
            v->z = (dx != 0.0f || dy != 0.0f || keys_held[SDL_SCANCODE_SPACE]) ? 24.0f : 6.0f;
        } else if (v->z > 0.0f || v->vz != 0.0f) {
            v->z += v->vz;
            v->vz -= 0.35f;
            if (v->z < 0.0f) { v->z = 0.0f; v->vz = 0.0f; }
        }

        float nx = v->x + cosf(v->angle) * v->speed;
        float ny = v->y + sinf(v->angle) * v->speed;
        if (!d->can_fly && !d->can_swim && v->z <= 2.0f && is_water(nx, ny)) {
            v->speed = -v->speed * 0.4f;
            nx = v->x; ny = v->y;
        }
        if (!d->can_fly && v->z < 12.0f) {
            for (int i = 0; i < MAX_BUILDINGS; i++) {
                const Building *b = &BUILDINGS[i];
                if (nx > b->x - 10 && nx < b->x + b->w + 10 && ny > b->y - 10 && ny < b->y + b->h + 10) {
                    nx = v->x; ny = v->y; v->speed *= 0.5f;
                }
            }
        }
        v->x = nx; v->y = ny;

        if (!d->can_fly && v->z <= 1.0f && v->speed > 2.5f) {
            for (int i = 0; i < MAX_RAMPS; i++) {
                const Ramp *rm = &RAMPS[i];
                if (v->x > rm->x && v->x < rm->x + rm->w && v->y > rm->y && v->y < rm->y + rm->h) {
                    v->vz = d->monster ? 7.5f : 5.8f;
                    score += 300;
                    coins += 5;
                    play_tone(880.0f, 3500);
                    snprintf(banner, sizeof(banner), "MEGA STUNT JUMP! +300");
                    banner_timer = 90;
                }
            }
        }
        player.x = v->x; player.y = v->y; player.z = v->z; player.angle = v->angle;
    } else {
        if (dx != 0.0f || dy != 0.0f) {
            float len = hypotf(dx, dy);
            float spd = keys_held[SDL_SCANCODE_SPACE] ? 3.4f : 2.5f;
            float nx = player.x + (dx / len) * spd;
            float ny = player.y + (dy / len) * spd;
            player.angle = atan2f(dy, dx);
            if (!is_water(nx, ny)) { player.x = nx; player.y = ny; }
        }
    }

    /* Park Soccer Ball */
    if (hypotf(player.x - ball_x, player.y - ball_y) < 18.0f) {
        float a = atan2f(ball_y - player.y, ball_x - player.x);
        ball_vx = cosf(a) * 5.5f;
        ball_vy = sinf(a) * 5.5f;
        play_tone(300.0f, 1200);
    }
    ball_x += ball_vx; ball_y += ball_vy;
    ball_vx *= 0.95f; ball_vy *= 0.95f;
    if (ball_x < 620.0f || ball_x > 850.0f) {
        score += 1000; coins += 15;
        play_tone(1046.5f, 5000);
        snprintf(banner, sizeof(banner), "SOCCER GOOOOOAL!! +1000");
        banner_timer = 140;
        ball_x = 735.0f; ball_y = 720.0f; ball_vx = 0; ball_vy = 0;
    }

    /* Projectiles & Mission Targets */
    for (int i = 0; i < MAX_PROJ; i++) {
        if (!projs[i].active) continue;
        projs[i].x += projs[i].vx;
        projs[i].y += projs[i].vy;
        if (--projs[i].life <= 0) projs[i].active = 0;
    }
    for (int i = 0; i < 3; i++) {
        Target *t = &targets[i];
        if (t->done) continue;
        if (mission_idx == 3) {
            t->x += t->vx; t->y += t->vy;
            if (t->x < 250 || t->x > 1250) t->vx = -t->vx;
            if (t->y < 250 || t->y > 1350) t->vy = -t->vy;
        }
        if (hypotf(player.x - t->x, player.y - t->y) < 28.0f) {
            t->done = 1;
            mission_prog++;
            score += 500; coins += 10;
            play_tone(987.0f, 3500);
            if (mission_prog >= mission_goal) start_mission(mission_idx + 1);
        }
        for (int j = 0; j < MAX_PROJ; j++) {
            if (projs[j].active && hypotf(projs[j].x - t->x, projs[j].y - t->y) < 22.0f) {
                projs[j].active = 0;
                t->done = 1;
                mission_prog++;
                score += 500; coins += 10;
                play_tone(987.0f, 3500);
                if (mission_prog >= mission_goal) start_mission(mission_idx + 1);
            }
        }
    }

    cam_x += ((player.x - REN_W * 0.5f) - cam_x) * 0.18f;
    cam_y += ((player.y - REN_H * 0.5f) - cam_y) * 0.18f;
    if (cam_x < 0) cam_x = 0;
    if (cam_y < 0) cam_y = 0;
}

static void render_frame(void) {
    int cx = (int)cam_x, cy = (int)cam_y;

    /* 1. Green Grass Base */
    fill_rect(0, 0, REN_W, REN_H, rgb(34, 197, 94));

    /* 2. Beach Sand & Ocean Water + River */
    fill_rect(0 - cx, 1480 - cy, 2400, 180, rgb(253, 230, 138));
    fill_rect(0 - cx, 1640 - cy, 2400, 760, rgb(2, 132, 199));
    fill_rect(1340 - cx, 0 - cy, 80, 1640, rgb(2, 132, 199));

    /* 3. Roads & Bridges */
    int avx[4] = {180, 520, 900, 1280};
    int sty[5] = {180, 470, 860, 1250, 1450};
    for (int i = 0; i < 4; i++) fill_rect(avx[i] - 42 - cx, 120 - cy, 84, 1380, rgb(51, 65, 85));
    for (int i = 0; i < 5; i++) fill_rect(120 - cx, sty[i] - 38 - cy, 1680, 76, rgb(51, 65, 85));
    fill_rect(1330 - cx, 540 - cy, 100, 90, rgb(100, 116, 139));
    fill_rect(1330 - cx, 930 - cy, 100, 90, rgb(100, 116, 139));
    /* Airport Helipad */
    fill_rect(1720 - cx, 240 - cy, 260, 860, rgb(71, 85, 105));
    fill_rect(1820 - cx, 320 - cy, 80, 80, rgb(250, 204, 21));

    /* 4. Soccer Pitch & Ball */
    fill_rect(620 - cx, 620 - cy, 230, 200, rgb(22, 163, 74));
    fill_rect((int)ball_x - 5 - cx, (int)ball_y - 5 - cy, 10, 10, rgb(255, 255, 255));

    /* 5. Yellow Stunt Ramps */
    for (int i = 0; i < MAX_RAMPS; i++) {
        fill_rect((int)RAMPS[i].x - cx, (int)RAMPS[i].y - cy, (int)RAMPS[i].w, (int)RAMPS[i].h, rgb(250, 204, 21));
    }

    /* 6. Mission Targets */
    for (int i = 0; i < 3; i++) {
        if (targets[i].done) continue;
        Color tc = (tick & 4) ? rgb(250, 204, 21) : rgb(239, 68, 68);
        fill_rect((int)targets[i].x - 10 - cx, (int)targets[i].y - 10 - cy, 20, 20, tc);
    }

    /* 7. Vehicles */
    for (int i = 0; i < MAX_VEHICLES; i++) {
        Vehicle *v = &vehicles[i];
        int vx = (int)v->x - cx;
        int vy = (int)(v->y - v->z) - cy;
        fill_rect(vx - v->def->w / 2, vy - v->def->h / 2, v->def->w, v->def->h, v->def->col);
        fill_rect(vx - v->def->w / 3, vy - 2, (v->def->w * 2) / 3, 4, v->def->stripe);
    }

    /* 8. Leo on Foot */
    if (player.veh_idx < 0) {
        fill_rect((int)player.x - 5 - cx, (int)player.y - 5 - cy, 10, 10, rgb(239, 68, 68));
        fill_rect((int)player.x - 3 - cx, (int)player.y - 3 - cy, 6, 6, rgb(37, 99, 235));
    }

    /* 9. 2.5D Buildings */
    for (int i = 0; i < MAX_BUILDINGS; i++) {
        const Building *b = &BUILDINGS[i];
        int bx = (int)b->x - cx, by = (int)b->y - cy;
        fill_rect(bx, by, (int)b->w, (int)b->h, b->wall);
        fill_rect(bx, by - 14, (int)b->w, (int)b->h - 8, b->roof);
        draw_text(bx + 12, by + (int)b->h / 2 - 8, b->label, rgb(255, 255, 255), 1);
    }

    /* 10. Projectiles */
    for (int i = 0; i < MAX_PROJ; i++) {
        if (projs[i].active) {
            fill_rect((int)projs[i].x - 3 - cx, (int)projs[i].y - 3 - cy, 6, 6, projs[i].col);
        }
    }

    /* 11. Top & Bottom HUD */
    fill_rect(0, 0, REN_W, 16, rgb(15, 23, 42));
    char hbuf[80];
    snprintf(hbuf, sizeof(hbuf), "SCORE:%05d COINS:%02d RIDE:%s",
             score, coins, player.veh_idx >= 0 ? vehicles[player.veh_idx].def->name : "ON FOOT");
    draw_text(8, 5, hbuf, rgb(253, 224, 71), 1);

    fill_rect(0, REN_H - 14, REN_W, 14, rgb(15, 23, 42));
    draw_text(8, REN_H - 10, banner, rgb(74, 222, 128), 1);

    if (game_state == 0) {
        fill_rect(32, 28, REN_W - 64, REN_H - 56, rgb(15, 23, 42));
        draw_text(84, 44, "SUPER LEO CITY", rgb(253, 224, 71), 2);
        draw_text(52, 74, "8 VEHICLES + DINO + HELICOPTER + SOCCER!", rgb(56, 189, 248), 1);
        draw_text(52, 96, "ARROWS: DRIVE ANYWHERE", rgb(255, 255, 255), 1);
        draw_text(52, 112, "E / ENTER: HOP IN OR OUT OF VEHICLE", rgb(255, 255, 255), 1);
        draw_text(52, 128, "Z: WATER CANNON / PIZZA / ICE CREAM", rgb(255, 255, 255), 1);
        draw_text(68, 156, "PRESS ENTER OR SPACE TO PLAY!", rgb(74, 222, 128), 1);
    }

    SDL_UpdateTexture(screen_tex, NULL, fb, REN_W * (int)sizeof(Uint32));
    SDL_RenderCopy(renderer, screen_tex, NULL, NULL);
    SDL_RenderPresent(renderer);
}

int main(int argc, char **argv) {
    (void)argc; (void)argv;
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER) < 0) return 1;
    SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "0");
    SDL_ShowCursor(SDL_DISABLE);
    if (SDL_NumJoysticks() > 0) SDL_JoystickOpen(0);

    window = SDL_CreateWindow("Super Leo City: Hero Patrol", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
                              1280, 720, SDL_WINDOW_FULLSCREEN_DESKTOP | SDL_WINDOW_SHOWN);
    if (!window) window = SDL_CreateWindow("Super Leo City", 0, 0, 1280, 720, SDL_WINDOW_FULLSCREEN);
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (!renderer) renderer = SDL_CreateRenderer(window, -1, 0);
    screen_tex = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING, REN_W, REN_H);

    SDL_AudioSpec want;
    memset(&want, 0, sizeof(want));
    want.freq = 22050;
    want.format = AUDIO_S16SYS;
    want.channels = 1;
    want.samples = 512;
    want.callback = audio_cb;
    if (SDL_OpenAudio(&want, NULL) >= 0) SDL_PauseAudio(0);

    init_city();

    int running = 1;
    Uint32 last = SDL_GetTicks();
    while (running) {
        memcpy(prev_held, keys_held, sizeof(keys_held));
        SDL_Event ev;
        while (SDL_PollEvent(&ev)) {
            if (ev.type == SDL_QUIT) running = 0;
            else if (ev.type == SDL_KEYDOWN) {
                SDL_Scancode sc = ev.key.keysym.scancode;
                if (sc == SDL_SCANCODE_ESCAPE) {
                    if (game_state == 0) running = 0;
                    else game_state = 0;
                }
                if (sc < SDL_NUM_SCANCODES) keys_held[sc] = 1;
            } else if (ev.type == SDL_KEYUP) {
                SDL_Scancode sc = ev.key.keysym.scancode;
                if (sc < SDL_NUM_SCANCODES) keys_held[sc] = 0;
            } else if (ev.type == SDL_JOYBUTTONDOWN || ev.type == SDL_JOYBUTTONUP) {
                int down = (ev.type == SDL_JOYBUTTONDOWN) ? 1 : 0;
                if (ev.jbutton.button == 0 || ev.jbutton.button == 1) keys_held[SDL_SCANCODE_E] = down;
                else if (ev.jbutton.button == 2 || ev.jbutton.button == 3) keys_held[SDL_SCANCODE_Z] = down;
                else if (ev.jbutton.button == 7 || ev.jbutton.button == 9) keys_held[SDL_SCANCODE_RETURN] = down;
            } else if (ev.type == SDL_JOYHATMOTION) {
                keys_held[SDL_SCANCODE_LEFT]  = (ev.jhat.value & SDL_HAT_LEFT)  ? 1 : 0;
                keys_held[SDL_SCANCODE_RIGHT] = (ev.jhat.value & SDL_HAT_RIGHT) ? 1 : 0;
                keys_held[SDL_SCANCODE_UP]    = (ev.jhat.value & SDL_HAT_UP)    ? 1 : 0;
                keys_held[SDL_SCANCODE_DOWN]  = (ev.jhat.value & SDL_HAT_DOWN)  ? 1 : 0;
            }
        }
        if (game_state == 0) {
            if (just_pressed(SDL_SCANCODE_RETURN) || just_pressed(SDL_SCANCODE_SPACE) || just_pressed(SDL_SCANCODE_E)) {
                game_state = 1;
                play_tone(523.25f, 3000);
            }
        } else {
            update_game();
        }
        render_frame();
        Uint32 now = SDL_GetTicks();
        int elapsed = (int)(now - last);
        if (elapsed < 16) SDL_Delay(16 - elapsed);
        last = SDL_GetTicks();
    }

    SDL_CloseAudio();
    SDL_Quit();
    return 0;
}
