const instructions = `
In this experiment, your earnings will depend on the decisions you make. At the beginning of the experiment, you will be assigned to a group of 4 participants. You will stay in the same group for the entire experiment. <br><br>

The experiment will consist of several periods. At the begging of each period, two members your group will take the role of producers. The other two will take the role of buyers. You will keep the same role keep for the entire period. Roles will be randomly reassigned at the beginning of each period. <br><br>

Each period will consist of several rounds. During each round, each participant in your group will select an action. Each of the two producers will select a quantity from 0 to 10. Each of the two buyers will select a bid from $0 to $1. Producer 1's cost will equal $COST1 times their quantity. Producer 2's cost will equal $COST2 times their quantity. Each producer's revenue will equal the highest bid times their quantity. A producer's profit will equal their revenue minus their cost. <br><br>

Purchase revenue 1 will equal $VALUE1 times producer 1's quantity. Purchase revenue 2 will equal $VALUE2 times producer 2's quantity. The total purchase revenue will equal purchase revenue 1 plus purchase revenue 2. Purchase cost 1 will equal producer 1's quantity times the highest bid. Purchase cost 2 will equal producer 1's quantity times the highest bid. The total purchase cost will equal purchase cost 1 plus purchase cost 2. The total purchase profit will equal the total purchase revenue minus the total purchase cost. <br><br>

The highest bidder's profit will equal the total purchase profit. The other bidder's profit will equal zero. In the case of a tie, each buyer's profit will equal half of the total purchase profit. The first round in each period will last for 5 seconds. Each of the other rounds will last for 1 second. At the end of each round, your payoff will equal your profit plus a $15 bonus. Your final earnings from the experiment will equal your average payoff over all rounds.<br><br>

During each round, you can select your action by moving your mouse. Moving your mouse to the right will increase your selection. Moving your mouse to the left will decrease your selection. Your current selection is listed at the bottom of the screen. <br><br>

The graph in the center of the screen illustrates the results of the previous round. The horizontal axis illustrates your action and the vertical exis illustrates your payoff. The horizontal position of the blue line indicates your action in the previous round. The height of the blue line indicates your payoff in the previous round. The green line illustrates how changing your action would have affected your payoff in the previous round.<br><br>

Before the experiment begins, you will participate in a practice period. The practice period will not affect your earnings. If you have any questions, please raise your hand.<br><br>
`

function getInstructions () {
  return instructions
}

export default getInstructions
