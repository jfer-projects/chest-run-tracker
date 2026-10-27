import type { ExerciseId } from './types';

export interface HowTo {
  /** Getting into position: gear, grip, stance. */
  setup: string[];
  /** The movement itself, in order. */
  steps: string[];
  /** The errors that cost results or hurt joints. */
  mistakes: string[];
  breathing: string;
}

const PUSHUP_SETUP = [
  'Put the Perfect Pushup handles shoulder-width apart on a mat or non-slip floor.',
  'Grip them with palms facing each other and wrists stacked under your shoulders.',
  'Walk your feet back into a straight plank, feet hip-width, glutes and abs braced.',
];

/** Written for the gear this program uses: Perfect Pushup handles, a doorway bar, dumbbells, a band and a chair. */
export const HOW_TO: Record<ExerciseId, HowTo> = {
  // ---------------- Workout A ----------------
  'perfect-pushup-deficit': {
    setup: PUSHUP_SETUP,
    steps: [
      'Lower for 3 seconds with your elbows about 45° from your torso, not flared wide.',
      'Keep going until your chest is about 2 inches below the level of the grips. You should feel a deep stretch across the chest.',
      'Pause for 1 second at the bottom without relaxing your shoulders.',
      'Press up hard. As your arms straighten, rotate the handles inward so your knuckles turn toward each other.',
      'Lock out, squeeze your chest for a beat, then lower again.',
    ],
    mistakes: [
      'Elbows flaring straight out to the sides, which strains the shoulders.',
      'Hips sagging or piking. Keep one straight line from head to heels.',
      'Dropping fast. The slow stretch is what makes this exercise work.',
      'Shrugging your shoulders up toward your ears at the bottom.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'low-bar-inverted-row': {
    setup: [
      'Lock the doorway bar low in the frame at about waist height and test it with your weight before the first set.',
      'Lie on your back under it with the bar across your chest line and your body at a right angle to the bar.',
      'Grip it overhand, a little wider than shoulders, arms straight.',
      'Heels on the floor, legs straight, body in one line. Bend your knees if that is too hard.',
    ],
    steps: [
      'Squeeze your shoulder blades together and pull your chest up toward the bar.',
      'Keep your body rigid the whole way up, with no sagging hips.',
      'Touch your lower chest to the bar with your elbows driving back, and pause for a second.',
      'Lower slowly until your arms are fully straight.',
    ],
    mistakes: [
      'Hips sagging or piking.',
      'Pulling with your arms only. Start each rep by squeezing your shoulder blades.',
      'Stopping short at the bottom. Go to full arm extension every rep.',
      'Shrugging up toward your ears.',
    ],
    breathing: 'Breathe out as you pull up, in as you lower.',
  },
  'incline-pushup-bar': {
    setup: [
      'Set the doorway bar to its lowest setting (about waist height), lock it in, and test it with your weight first.',
      'Face the bar and hold it slightly wider than shoulder-width with your shoulders square to it.',
      'Walk your feet back until you are in a straight, sloped plank with your arms straight. The further back your feet, the harder it gets.',
    ],
    steps: [
      'Lower your lower chest toward the bar over 4 seconds, elbows at roughly 45°. At waist height this is an easy angle, so the slow tempo is what makes it work.',
      'Touch the bar, or hover just above it, with your lower breastbone and pause for 1 second.',
      'Press down and slightly away from the bar, as if pushing it toward your hips like a chest dip.',
      'Squeeze at the top and repeat. Too easy? Lift one foot off the floor or switch to the chair version.',
    ],
    mistakes: [
      'Hands on the door frame instead of the bar.',
      'Elbows flaring wide.',
      'Hips dropping or sticking up.',
      'Rushing the reps. At this height, speed turns it into a wall push-up.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'incline-pushup-chair': {
    setup: [
      'Push a sturdy chair against a wall so it cannot slide. Test it by leaning your weight on the seat.',
      'Face the chair and put your hands on the front edge of the seat, slightly wider than your shoulders.',
      'Walk your feet back until your body is one straight, sloped line and your arms are straight.',
    ],
    steps: [
      'Lower your lower chest to the seat edge over 3 seconds, elbows at roughly 45°.',
      'Pause for 1 second just above the seat.',
      'Press down and slightly away from the chair, like a chest dip, until your arms are straight.',
      'Squeeze your chest at the top and repeat.',
    ],
    mistakes: [
      'A chair that can slide or tip. Always use a wall.',
      'Elbows flaring wide.',
      'Hips sagging or sticking up.',
      'Gripping the sides of the seat. Keep your hands flat on the front edge.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'db-bicep-curl': {
    setup: [
      'Stand tall, feet hip-width, a dumbbell in each hand with arms hanging and palms facing forward.',
      'Pin your elbows to your ribs and keep them there.',
    ],
    steps: [
      'Curl both dumbbells toward your shoulders without letting your elbows drift forward.',
      'As you curl, turn your pinkies up so your palms face your shoulders at the top.',
      'Squeeze your biceps for a beat.',
      'Lower over 2 seconds back to fully straight arms.',
    ],
    mistakes: [
      'Swinging your torso to heave the weight up.',
      'Elbows drifting forward.',
      'Dropping the weight instead of lowering it.',
      'Stopping short of straight arms at the bottom.',
    ],
    breathing: 'Breathe out as you curl, in as you lower.',
  },
  'db-floor-fly': {
    setup: [
      'Lie on a mat with your knees bent and feet flat. Use lighter dumbbells than you press with.',
      'Hold them straight over your chest, palms facing each other, with a soft bend in your elbows that stays the same all set.',
    ],
    steps: [
      'Open your arms out wide in a smooth arc until your upper arms touch the floor.',
      'Pause for a moment without letting the weights drop.',
      'Squeeze your chest to bring the dumbbells back up along the same arc, as if hugging a big tree.',
      'Finish with the dumbbells over your chest and squeeze for 1 second.',
    ],
    mistakes: [
      'Bending and straightening the elbows. That turns it into a press.',
      'Going too heavy, which pulls on the shoulders.',
      'Letting your arms crash into the floor.',
      'Arching your lower back off the mat.',
    ],
    breathing: 'Breathe in as your arms open, out as they close.',
  },
  'band-pull-apart': {
    setup: [
      'Hold a light band in front of you at shoulder height, hands about shoulder-width apart, palms down.',
      'Stand tall with your ribs down and arms straight.',
    ],
    steps: [
      'Pull the band apart by moving your hands out to the sides, leading with your shoulder blades.',
      'Keep your arms straight and at shoulder height until the band touches your chest.',
      'Squeeze your shoulder blades together for a second.',
      'Return slowly. Do not let the band snap your hands back in.',
    ],
    mistakes: [
      'Shrugging your shoulders up.',
      'Leaning back or arching your lower back.',
      'Letting the band yank your hands in.',
      'A band so heavy that your reps get short.',
    ],
    breathing: 'Breathe out as you pull apart, in as you return.',
  },
  'db-reverse-fly': {
    setup: [
      'Hold light dumbbells and hinge forward at the hips until your torso is about 45° or flatter, back flat, knees soft.',
      'Let the dumbbells hang under your shoulders with palms facing each other and elbows slightly bent.',
    ],
    steps: [
      'Raise both arms out to the sides in a wide arc, leading with your elbows.',
      'Stop when your arms are level with your shoulders and squeeze your shoulder blades.',
      'Lower slowly over 2 to 3 seconds.',
    ],
    mistakes: [
      'Swinging your torso up and down.',
      'Going too heavy.',
      'Shrugging so your neck does the work.',
      'Rounding your back.',
    ],
    breathing: 'Breathe out as you lift, in as you lower.',
  },
  'perfect-pushup-iso-hold': {
    setup: [
      ...PUSHUP_SETUP,
      'Do this last, when your chest is already tired. Use a clock or count out loud to time the holds.',
    ],
    steps: [
      'Lower slowly to the deep bottom position, chest just below the grips, and hold for 5 seconds.',
      'Press up to halfway (elbows about 90°) and hold for 5 seconds.',
      'Press to the top, rotate the handles inward, squeeze, and hold for 5 seconds.',
      'Repeat that cycle until you cannot hold good form, then stop and log your total seconds.',
    ],
    mistakes: [
      'Holding your breath.',
      'Letting your hips sag as you tire. Stop when they do.',
      'Collapsing into the bottom instead of lowering under control.',
      'Pushing through shoulder pain.',
    ],
    breathing: 'Breathe slowly and steadily the whole time. Never hold your breath.',
  },

  // ---------------- Workout B ----------------
  'glute-bridge-floor-press': {
    setup: [
      'Lie on a mat with a dumbbell in each hand, knees bent and feet flat about hip-width apart.',
      'Drive through your heels to lift your hips into a high glute bridge, a straight line from knees to shoulders.',
      'Bring the dumbbells to chest height with your elbows out at about 45°.',
    ],
    steps: [
      'Hold the bridge for the whole set: glutes squeezed, hips high. This is what creates the decline angle.',
      'Press the dumbbells straight up over your chest until your arms are straight.',
      'Lower under control until the backs of your upper arms lightly touch the floor.',
      'Pause for a second without relaxing, then press again.',
    ],
    mistakes: [
      'Letting your hips drop between reps.',
      'Bouncing your arms off the floor.',
      'Elbows flared out to 90°.',
      'Arching your lower back instead of squeezing your glutes.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'bent-over-db-row': {
    setup: [
      'Stand with feet hip-width, a dumbbell in each hand.',
      'Hinge at the hips with soft knees until your torso is about 45° to the floor, back flat and neck long.',
      'Let the dumbbells hang under your shoulders with palms facing each other.',
    ],
    steps: [
      'Pull both dumbbells toward your hip pockets, driving your elbows back and close to your body.',
      'Squeeze your shoulder blades together and hold for 1 second.',
      'Lower slowly until your arms are straight, keeping the same torso angle.',
    ],
    mistakes: [
      'Standing up taller as you row.',
      'Rounding your lower back.',
      'Pulling straight up to your armpits instead of toward your hips.',
      'Jerking the weights up with momentum.',
    ],
    breathing: 'Breathe out as you row, in as you lower.',
  },
  'close-grip-perfect-pushup': {
    setup: [
      'Set the handles only 6 to 8 inches apart, directly under your chest.',
      'Wrists under shoulders, plank position, feet hip-width, body in a straight line.',
    ],
    steps: [
      'Lower with your elbows tucked against your ribs, not flared.',
      'Go down until your chest is level with, or just above, the handles.',
      'Press up. Near the top, twist the handles inward and squeeze your inner chest.',
      'Lock out and repeat.',
    ],
    mistakes: [
      'Elbows flaring out.',
      'Hips sagging.',
      'Hands too far forward, which strains the wrists.',
      'Half reps. Go all the way down and all the way up.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'overhead-db-tricep-ext': {
    setup: [
      'Sit upright on a chair or stand tall. Hold one dumbbell vertically with both hands cupped around the top plate.',
      'Press it overhead to full arm extension, upper arms close to your ears.',
    ],
    steps: [
      'Keep your upper arms still and elbows pointing forward as you lower the dumbbell behind your head.',
      'Stop when your elbows are bent about 90° and you feel a stretch along the back of your arms.',
      'Pause briefly, then straighten your elbows to press back to lockout, squeezing your triceps.',
    ],
    mistakes: [
      'Elbows flaring out wide.',
      'Arching your lower back.',
      'Moving your upper arms instead of just your forearms.',
      'A weight so heavy you lose control behind your head.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'bridge-squeeze-press': {
    setup: [
      'Lie on a mat, knees bent, a dumbbell in each hand, and lift your hips into a high glute bridge.',
      'Bring the dumbbells together over your chest so they touch, palms facing each other.',
    ],
    steps: [
      'Crush the dumbbells into each other and keep that pressure for the whole set.',
      'Lower them to the middle of your chest with your elbows about 45° from your body.',
      'Press straight up, still squeezing the dumbbells together.',
      'Squeeze your inner chest at the top, keep your hips high, and repeat.',
    ],
    mistakes: [
      'Letting the dumbbells drift apart.',
      'Letting your hips drop.',
      'A weight too heavy to keep the squeeze.',
      'Elbows flaring wide.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'chin-up': {
    setup: [
      'Move the doorway bar to its overhead position, lock it in, and make sure it is rated for your weight.',
      'Grab it underhand (palms facing you) about shoulder-width apart.',
      'Hang with straight arms and bend your knees so your feet are off the floor. Brace your core.',
    ],
    steps: [
      'Start by pulling your shoulder blades down and back.',
      'Pull your chest toward the bar, driving your elbows down toward your ribs, until your chin clears the bar.',
      'Pause for a second at the top.',
      'Lower yourself slowly to fully straight arms.',
    ],
    mistakes: [
      'Kicking or swinging for momentum.',
      'Stopping short of straight arms at the bottom.',
      'Craning your neck to get over the bar.',
      'Trusting the doorway bar without checking it. Re-check it before every set.',
    ],
    breathing: 'Breathe out as you pull, in as you lower.',
  },
  'bench-dips': {
    setup: [
      'Use a sturdy chair or the edge of a couch that will not slide. Push it against a wall if you can.',
      'Sit on the edge with your hands gripping beside your hips and fingers pointing forward.',
      'Slide your hips off the seat and straighten your legs in front of you, heels on the floor.',
    ],
    steps: [
      'With your elbows pointing straight back, lower your hips until your elbows are bent to about 90°. No deeper.',
      'Lean your torso slightly forward to bias the lower chest.',
      'Press down through your palms to straighten your arms.',
      'Hold the top for 2 seconds, then repeat until you cannot do another clean rep.',
    ],
    mistakes: [
      'Going below 90°, which strains the front of the shoulder.',
      'Shoulders creeping up toward your ears.',
      'Hips drifting far away from the chair.',
      'Pushing through shoulder pain. Stop and use the close-grip push-up swap instead.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },

  // ---------------- Swap alternatives ----------------
  'perfect-pushup-standard': {
    setup: PUSHUP_SETUP,
    steps: [
      'Lower for 3 seconds with your elbows about 45° from your torso.',
      'Stop when your chest is level with the tops of the grips. Do not go deeper than that.',
      'Press up and rotate the handles slightly inward at the top.',
      'Squeeze your chest and repeat.',
    ],
    mistakes: [
      'Sinking below grip level. That is the deficit version, which stretches the shoulder more.',
      'Hips sagging or piking.',
      'Elbows flaring wide.',
      'Rushing the lowering.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'close-grip-burnout': {
    setup: [
      'Set the handles 6 to 8 inches apart under your chest, wrists under shoulders.',
      'Plank position with your body in a straight line.',
    ],
    steps: [
      'Do close-grip push-ups at a steady rhythm with your elbows tucked.',
      'When strict reps stop, drop to your knees and keep going for a few more.',
      'Stop when form breaks or you cannot finish another rep, then log your total.',
    ],
    mistakes: [
      'Letting your elbows flare as you tire.',
      'Sagging hips.',
      'Sloppy half reps to inflate the count.',
    ],
    breathing: 'Breathe in as you lower, out as you press.',
  },
  'chin-up-negative': {
    setup: [
      'Lock the doorway bar overhead and put a sturdy chair underneath it.',
      'Step up and take an underhand, shoulder-width grip with your chin over the bar. This is your start position.',
    ],
    steps: [
      'Lift your feet off the chair, chin above the bar.',
      'Lower yourself as slowly as you can, aiming for 3 to 5 seconds, until your arms are straight.',
      'Step back onto the chair, return to the top, and repeat.',
    ],
    mistakes: [
      'Dropping fast. The slow lowering is the whole exercise.',
      'Jumping up to the top instead of using the chair.',
      'Not re-checking that the doorway bar is locked in.',
    ],
    breathing: 'Breathe steadily as you lower. Do not hold your breath.',
  },

  // ---------------- Leg Day ----------------
  'goblet-squat': {
    setup: [
      'Stand with your feet slightly wider than shoulders and toes turned out about 20°.',
      'Hold one dumbbell vertically against your chest, cupped under the top plate, elbows pointing down.',
    ],
    steps: [
      'Brace your core and sit your hips down and back between your heels.',
      'Keep your chest tall and your elbows inside your knees as you descend.',
      'Lower until your thighs are at least parallel to the floor, or as deep as you can with a flat back.',
      'Drive through your whole foot to stand, squeezing your glutes at the top.',
    ],
    mistakes: [
      'Knees caving inward.',
      'Heels lifting off the floor.',
      'Chest dropping and back rounding.',
      'Bouncing out of the bottom.',
    ],
    breathing: 'Breathe in as you descend, out as you stand.',
  },
  'db-rdl': {
    setup: [
      'Stand tall with feet hip-width and the dumbbells in front of your thighs, palms facing you.',
      'Soften your knees slightly and keep them that way.',
    ],
    steps: [
      'Push your hips straight back, as if closing a car door with your backside.',
      'Slide the dumbbells down your thighs with a flat back and your shoulder blades pulled back.',
      'Lower until you feel a strong stretch in your hamstrings, usually around mid-shin.',
      'Drive your hips forward to stand tall, squeezing your glutes.',
    ],
    mistakes: [
      'Rounding your back.',
      'Squatting instead of hinging, with the knees bending a lot.',
      'Letting the weights drift away from your legs.',
      'Leaning back at the top.',
    ],
    breathing: 'Breathe in as you lower, out as you stand.',
  },
  'bulgarian-split-squat': {
    setup: [
      'Stand about two feet in front of a sturdy chair, facing away from it. Rest the top of one foot on the seat behind you.',
      'Hold dumbbells at your sides, or start with bodyweight.',
      'Step your front foot far enough forward that your front shin stays fairly upright as you lower.',
    ],
    steps: [
      'Lower straight down by bending your front knee, torso slightly forward and back knee heading toward the floor.',
      'Go until your front thigh is about parallel to the floor.',
      'Drive through your front heel to stand.',
      'Finish all reps on one leg, then switch legs.',
    ],
    mistakes: [
      'Front foot too close, which pushes the knee far past your toes.',
      'Pushing off the back foot instead of the front leg.',
      'Torso collapsing forward.',
      'A chair that can slide. Push it against a wall.',
    ],
    breathing: 'Breathe in as you lower, out as you stand.',
  },
  'reverse-lunge': {
    setup: [
      'Stand tall, feet hip-width, a dumbbell in each hand at your sides.',
      'Clear some space behind you.',
    ],
    steps: [
      'Step one foot straight back about 2 to 3 feet.',
      'Lower until both knees are bent about 90° and your back knee hovers just above the floor.',
      'Push through your front heel to return to standing.',
      'Alternate legs, or finish one side and then switch.',
    ],
    mistakes: [
      'Short steps that put all the strain on the front knee.',
      'Front knee caving in.',
      'Leaning forward.',
      'Slamming the back knee into the floor.',
    ],
    breathing: 'Breathe in as you lower, out as you push up.',
  },
  'db-calf-raise': {
    setup: [
      'Stand holding dumbbells at your sides with the balls of your feet on the edge of a step or a thick book. The floor works too.',
      'Rest one hand lightly on a wall or door frame for balance.',
    ],
    steps: [
      'Rise onto your toes as high as you can.',
      'Pause for 1 second at the top, squeezing your calves.',
      'Lower slowly, below the step level if you are on one, for a full stretch.',
      'Repeat for all reps without bouncing.',
    ],
    mistakes: [
      'Bouncing through the reps.',
      'Partial range of motion.',
      'Rolling your ankles outward.',
      'Rushing the lowering.',
    ],
    breathing: 'Breathe out as you rise, in as you lower.',
  },
  'wall-sit': {
    setup: [
      'Stand with your back against a smooth wall and your feet about two feet out in front of you.',
      'Rest your hands on your thighs or cross them over your chest. Do not push on your legs.',
    ],
    steps: [
      'Slide down the wall until your thighs are parallel to the floor and your knees are right above your ankles.',
      'Press your back and shoulders flat to the wall.',
      'Hold as long as you can while breathing steadily.',
      'Slide up slowly when your form fades, and log the seconds.',
    ],
    mistakes: [
      'Knees drifting past your toes.',
      'Pushing on your thighs with your hands.',
      'Holding your breath.',
      'Stopping with your hips higher than your knees.',
    ],
    breathing: 'Breathe slowly and steadily the whole time.',
  },
};
