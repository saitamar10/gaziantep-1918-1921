extends CharacterBody3D
## Birinci şahıs denetleyici: WASD yürü, Shift koş, C çömel, fare bak. Tıklayınca fare kilitlenir, Esc bırakır.
## Yatay çarpışma iki katmanlıdır: kahraman sokaktaki fizik gövdeleri (move_and_slide) + şehrin 2B ayak izleri (City.resolve).
## Yükseklik araziden okunur (City.ground); yerçekimi yoktur.

const WALK := 3.4
const RUN := 7.5
const EYE := 1.62
const RADIUS := 0.32
var cam: Camera3D
var city: City
var yaw := 0.0
var pitch := 0.0
var crouch := 0.0
var speed_scale := 1.0  # sırtta yaralı varken yavaşlar
var enabled := true
var bob := 0.0
var sfx: Sfx
var sens := 0.0021       # fare hassasiyeti (Ayarlar)
var base_fov := 72.0     # görüş açısı (Ayarlar)
var step_n := 0
var shake := 0.0       # bombardıman sarsıntısı (0..1)
var lift := 0.0        # goruntu almak icin kamerayi yukseltir (--at x,z,yaw,yukseklik)


func _ready() -> void:
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = RADIUS
	cap.height = 1.5
	shape.shape = cap
	shape.position.y = 1.0   # alt ucu yerden 25 cm yukarıda: eşik ve kaldırım taşına takılmaz
	add_child(shape)
	cam = Camera3D.new()
	cam.fov = 72
	cam.near = 0.08
	cam.far = 1500
	cam.position.y = EYE
	add_child(cam)
	cam.make_current()


## Bakış _input'ta işlenir: arayüz öğeleri fare hareketini yutamaz (fare kilitliyken imleç ekranın ortasında sayılır).
func _input(e: InputEvent) -> void:
	if e is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and enabled:
		yaw -= e.relative.x * sens
		pitch = clampf(pitch - e.relative.y * sens, -1.45, 1.45)


func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.pressed and enabled and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif e is InputEventKey and e.pressed and e.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _physics_process(dt: float) -> void:
	rotation.y = yaw
	var ix := 0.0
	var iz := 0.0
	if enabled:
		ix = float(Input.is_physical_key_pressed(KEY_D)) - float(Input.is_physical_key_pressed(KEY_A))
		iz = float(Input.is_physical_key_pressed(KEY_S)) - float(Input.is_physical_key_pressed(KEY_W))
	var want_crouch := 1.0 if (enabled and Input.is_physical_key_pressed(KEY_C)) else 0.0
	crouch = lerpf(crouch, want_crouch, minf(1.0, dt * 10.0))
	var run := Input.is_physical_key_pressed(KEY_SHIFT) and crouch < 0.3
	var sp := (RUN if run else WALK) * (1.0 - crouch * 0.5) * speed_scale
	var dir := (transform.basis * Vector3(ix, 0, iz))
	dir.y = 0
	if dir.length() > 1.0:
		dir = dir.normalized()
	var k := minf(1.0, dt * 9.0)
	velocity.x = lerpf(velocity.x, dir.x * sp, k)
	velocity.z = lerpf(velocity.z, dir.z * sp, k)
	velocity.y = 0.0
	move_and_slide()
	if city:
		var p := city.resolve(Vector2(global_position.x, global_position.z), RADIUS)
		var gy := city.ground(p.x, p.y)
		# basamak ve eğimde ani sıçrama olmasın
		global_position = Vector3(p.x, lerpf(global_position.y, gy, minf(1.0, dt * 14.0)), p.y)
	var hs := Vector2(velocity.x, velocity.z).length()
	bob += hs * dt * 2.1
	if sfx and hs > 0.6 and int(bob / PI) != step_n:
		step_n = int(bob / PI)
		sfx.play("step", 0.22 + minf(0.2, hs * 0.03), randf_range(0.85, 1.15))
	cam.position.y = lift + EYE - crouch * 0.55 + sin(bob) * minf(1.0, hs / 4.0) * 0.035
	cam.rotation = Vector3(pitch, 0, 0)
	var sk := shake * shake * 0.12
	cam.h_offset = (randf() - 0.5) * sk
	cam.v_offset = (randf() - 0.5) * sk


func place(p: Vector3, new_yaw: float = 0.0) -> void:
	if city:
		var q := city.resolve(Vector2(p.x, p.z), RADIUS)   # yapının içine düşmesin
		p = Vector3(q.x, city.ground(q.x, q.y), q.y)
	global_position = p
	yaw = new_yaw
	rotation.y = yaw
	pitch = 0.0
	velocity = Vector3.ZERO
