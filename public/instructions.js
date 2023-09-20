const instructions = `
Your earnings in this experiment will depend on the decisions you make. At the beginning of the experiment, you will be assigned to a group of 4 participants. You will stay in the same group for the entire experiment. <br><br>

The experiment will consist of several rounds. At the beginning of each round, two members your group will take the role of producers and the other two will take the role of bidders. You will keep the same role keep for the whole round. Roles will be randomly reassigned at the beginning of each round. <br><br>

Each round will consist of 60 periods. During a period, each member of your group will select an action. Each producer will select a quantity from 0 to 10 and each bidder will select a bid from $0 to $1. The price will equal the highest bid in your group. Producer 1's cost will equal $COST1 times their quantity. Producer 2's cost will equal $COST2 times their quantity. A producer's revenue will equal the price times their quantity. A producer's profit will equal their revenue minus their cost. <br><br>

Value 1 will equal $QUALITY1 times producer 1's quantity. Value 2 will equal $QUALITY2 times producer 2's quantity. The total value will equal value 1 plus value 2. The total expenditure will equal producer 1's revenue plus producer 2's revenue. The highest bidder's profit will equal the total value minus the total expenditure. The other bidder's profit will equal zero. If there is a tie for the highest bid, each bidder's profit will equal half the total value minus half the total expenditure.<br><br> 

Before the experiment begins, you will participate in a practice round. The practice round will not affect your earnings. The first period in each round will last for 5 seconds. The other periods will each last for 1 second. During each period, you can adjust your selection by moving your mouse. Moving your mouse to the right will increase your selection. Moving your mouse to the left will decrease your selection. Your payoff at the end of each period will equal your profit plus a $15 bonus. Your final earnings will equal your average payoff over all periods. <br><br>

Your selection for the current period is listed at the bottom of the screen. The graph on your screen illustrates the results of the previous period. The horizontal position of the blue line indicates your selection in the previous period. The height of the blue line indicates your payoff in the previous period. The green line illustrates how changing your selection would have changed your payoff in the previous period. If you have any questions, please raise your hand.<br><br>
`

function getInstructions () {
  return instructions
}

export default getInstructions
