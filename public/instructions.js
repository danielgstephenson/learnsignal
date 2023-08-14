const instructions = `
Your earnings in this nexperiment will depend on the decisions you make. At the beginning of the experiment, you will be assigned to a group of 4 participants. You will stay in the same group for the entire experiment. <br><br>

The experiment will consist of several rounds. At the begging of each round, two members your group will take the role of producers and the other two will take the role of bidders. You will keep the same role keep for the whole round. Roles will be randomly reassigned at the beginning of each round. <br><br>

Each round will consist of several periods. During a period, each member of your group will select an action. Each producer will select a quantity from 0 to 10. Each bidder will select a bid from $0 to $1. The price will equal the highest bid in your group. Producer 1's cost will equal $COST1 times their quantity. Producer 2's cost will equal $COST2 times their quantity. A producer's revenue will equal the price times their quantity. A producer's profit will equal their revenue minus their cost. <br><br>

Value 1 will equal $QUALITY1 times producer 1's quantity. Value 2 will equal $QUALITY2 times producer 2's quantity. The total value will equal value 1 plus value 2. Expenditure 1 will equal producer 1's quantity times the price. Expenditure 2 will equal producer 2's quantity times the price. The total expenditure will equal expenditure 1 plus expenditure 2. The total purchase profit will equal the total value minus the total expenditure. <br><br>

The highest bidder's profit will equal the total purchase profit. The other bidder's profit will equal zero. If there is a tie for the highest bid, each bidder's profit will equal half of the total purchase profit. The first period in each round will last for 5 seconds. Each of the other periods will last for 1 second. At the end of each period, your payoff will equal your profit plus a $15 bonus. Your final earnings from the experiment will equal your average payoff over all periods.<br><br>

During each period, you can adjust your selection by moving your mouse. Moving your mouse to the right will increase your selection. Moving your mouse to the left will decrease your selection. Your current selection is listed at the bottom of the screen. <br><br>

The graph in the center of the screen illustrates the results of the previous period. The horizontal position of the blue line indicates your selection in the previous period. The height of the blue line indicates your payoff in the previous period. The green line illustrates how changing your selection would have changed your payoff in the previous period.<br><br>

Before the experiment begins, you will participate in a practice round. The practice round will not affect your earnings. If you have any questions, please raise your hand.<br><br>
`

function getInstructions () {
  return instructions
}

export default getInstructions
