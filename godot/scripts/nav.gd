class_name Nav
extends RefCounted
## Yaya yol ağı: şehrin bütün sokaklarından çıkarılmış düğüm/kenar grafiği (tools/bake_city.mjs --nav -> city/nav.json).
## Sakinler bu ağ üzerinde yürür; rota A* ile bulunur. Aynı dosyada hikâye yerleri de durur (toplantı bahçesi, han, cami, meydan).

const CELL := 20.0

var pos := PackedVector2Array()
var adj: Array = []        # düğüm -> PackedInt32Array (komşular)
var grid := {}             # Vector2i -> PackedInt32Array
var info := {}


func load_file(path: String) -> Nav:
	info = JSON.parse_string(FileAccess.get_file_as_string(path))
	var n: Array = info["nodes"]
	pos.resize(n.size() / 2)
	adj.resize(pos.size())
	for i in pos.size():
		pos[i] = Vector2(n[i * 2], n[i * 2 + 1])
		adj[i] = PackedInt32Array()
		var k := Vector2i(int(floor(pos[i].x / CELL)), int(floor(pos[i].y / CELL)))
		if not grid.has(k):
			grid[k] = PackedInt32Array()
		grid[k].append(i)
	var e: Array = info["edges"]
	for i in range(0, e.size(), 3):
		adj[int(e[i])].append(int(e[i + 1]))
		adj[int(e[i + 1])].append(int(e[i]))
	info.erase("nodes")
	info.erase("edges")
	return self


func _around(p: Vector2, r: float) -> PackedInt32Array:
	var out := PackedInt32Array()
	for cz in range(int(floor((p.y - r) / CELL)), int(floor((p.y + r) / CELL)) + 1):
		for cx in range(int(floor((p.x - r) / CELL)), int(floor((p.x + r) / CELL)) + 1):
			var a = grid.get(Vector2i(cx, cz))
			if a != null:
				out.append_array(a)
	return out


## En yakın düğüm (yoksa -1)
func nearest(p: Vector2, max_r := 60.0) -> int:
	var best := -1
	var bd := max_r
	for i in _around(p, max_r):
		var d := p.distance_to(pos[i])
		if d < bd:
			bd = d
			best = i
	return best


## p çevresinde [r0, r1] halkasında rastgele bir düğüm (yoksa -1)
func random_near(p: Vector2, r0: float, r1: float, rng: RandomNumberGenerator) -> int:
	var c := PackedInt32Array()
	for i in _around(p, r1):
		var d := p.distance_to(pos[i])
		if d >= r0 and d <= r1:
			c.append(i)
	return c[rng.randi() % c.size()] if c.size() > 0 else -1


## A*: düğüm dizisi döner (bulunamazsa boş)
func path(a: int, b: int, limit := 3000) -> PackedInt32Array:
	var out := PackedInt32Array()
	if a < 0 or b < 0:
		return out
	if a == b:
		out.append(a)
		return out
	var g := {a: 0.0}
	var from := {}
	var open := [a]
	var f := {a: pos[a].distance_to(pos[b])}
	var closed := {}
	var steps := 0
	while not open.is_empty() and steps < limit:
		steps += 1
		var bi := 0
		for i in range(1, open.size()):
			if f[open[i]] < f[open[bi]]:
				bi = i
		var cur: int = open[bi]
		open.remove_at(bi)
		if cur == b:
			out.append(b)
			var c := b
			while from.has(c):
				c = from[c]
				out.append(c)
			out.reverse()
			return out
		if closed.has(cur):
			continue
		closed[cur] = true
		for nb in adj[cur]:
			if closed.has(nb):
				continue
			var ng: float = g[cur] + pos[cur].distance_to(pos[nb])
			if ng < g.get(nb, 1e9):
				g[nb] = ng
				from[nb] = cur
				f[nb] = ng + pos[nb].distance_to(pos[b])
				open.append(nb)
	return out
