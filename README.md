# badminton-court-scheduler
Use `npm run dev` to test locally.

## Scheduling Algorithm
The court scheduling algorithm aims to optimize groups of players on the available courts based on the following heuristics:
1. TIME: Players who have waited longer should have higher priority
2. DIVERSITY: Players who have played together less should be paired together with higher priority
3. SKILL: Players should be matched with approximate balance between the two sides

### Time Heuristic
The app should track the time each active player finished their last game. Players who have waited longer will be ranked higher in the queue.

### Diversity Heuristic
The app should track a list for each player, that maps to all other active players (basically, a matrix of players). Each entry should store the time since these players last played together, and/or the number of times these players have played together. Players who have not played together in a long time, or who have played together few total times will be paired together with higher priority.

To make this more robust, we could also separate this value into "played on same team" and "played against each other", which could be weighted separately (so people who have only played together would be weighted higher to play against each other).

### Skill Heuristic
Players will be assigned a skill rating in their player data (assigned by the admin or by themselves depending on setup choice). The algorithm uses this to balance teams on each court, so that the numbers are close to matching on each side. For example, we could store player skill in tiers, like (1, 2, 3) and the algorithm would try to keep both sides at the same total value (so a 1 and 3 against 2 and 2 for example).

To add variety into this, since it's often fun when there's occasionally imbalance in games (being the "underdog"), we could have this balancing follow more of a curve, where it normally tries to balance the teams exactly, but also makes some games that are imbalanced by 1 or 2.

Furthermore, we could potentially add much more depth into the skill rankings, such as splitting it into sub-skills, making a more precise scale (out of 10 or 100), or other such metrics. Custom player preferences could also potentially be applied here (pairing couples together? etc.)
