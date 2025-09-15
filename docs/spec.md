# Cost Management Hub

## Objective

Building a product that I can use to manage cost in my company where I can view the different projects spend and track where that spend is actually going. Where I can see the spend in the different buckets and sub buckets. For example, we have a Wireline project we placed huge amount of POs, I'd like to ideally be able to map these POs first of all to the project itself, then add them to specific spend buckets, like I would have POs that are maintenance related, which are like parts to service the tools that will be used on this project, and other category is operational related POs, which are for parts or services required for the operation itself. I’d like also to be able to have the freedom to decide on the sub categories for example for the maintenance parts, be able to assign a sub category like units maintenance related spend, this I think will unlock for me some powerful insights.

This solution should also ideally be the point where we can input the project spend assumptions which happens at the tender phase, we do this normally on an excel sheet to workout the P&L of the project and assume what spend will be associated with it. So let's assume at the tender phase of the same example I provided of a specific Wireline project, the P&L was built at the tender phase to assume the revenue would be a certain value, and spend for each cost line to be specific values and having assumptions under each cost line. I expect our product to have the ability to capture these initial inputs and provide the possibility to update these assumptions when we have our regular business reviews for example every month or every quarter, we would be able to see how these evolved over the time from tender phase all the way through to the actual project start date and till its end, we should be able to catch things like if we added additional input to our initial cost assumption we can see that, like in Aug total project cost assumption was 500k, where 100k was for M&S, then in Sep we had a review and we added another 50k to M&S, later in December we should be able to see how these assumptions evolved, and can be able to answer questions and provide explanations when we get challenged, for example this extra 50k was from our maintenance teams asking to allocate 50k to refurbish the unit, while revenue is the same, and reducing project profitability versus our initial assumption, this will immediately allow us to make proper business decisions like speaking with upper management to explore using a different unit or allowing the sales team to negotiate price increase with customer to recover this cost. And then when we start issuing POs to the suppliers for example in October we can allocate these POs to the cost lines, and for example by December we can see we have hit our 150k M&S budget, this can immediately allow us to make discussions with the team to review if we need to further update our assumptions. The way I do this at the moment is we have a project P&L that is done on an excel sheet by the Sales team, I feel they are in a vacuum, and after we are awarded with the contract and actually start spending I struggle to keep track of the cost, as I'm raising POs for multiple projects and often neglect the assumptions made during the P&L exercise during the tender process, we always tend to explain things after the fact, why did we close this month higher than the forecast, and then we start looking at all the invoiced POs and try to link them to the projects and come up with an explanation, we are never in control.

I expect our product to be fed at the start with all the POs I will pull from our business system, with the minimum required information, for example PO number, each PO line part number and part description, the quantity, the plant number, creation date, total value, invoice date and goods reception date if been invoiced or received, while our business system has other information we can pull like project number in some cases, but since I know this information is not reliable, I want this input to be provided in our own product, so think of this product as a layer being built on top of the one we have in our company to overcome the challenges we are having and allow us to input and map valuable information to our POs, giving us absolute flexibility to tailor this information based on our use cases. Once this product is established we can assume that we update its database with the new POs on daily basis for example, and would have like an inbox which displays the news POs and that we need to process them as in map and add the required information like project name, spend type and other things we will discuss later as we finalize our requirements.

### Initial Product Ideas

The idea is to first build the product to manage the most complex cost line M&S (Materials and Supplies) and then if it works we expand our solution to include the other cost lines, each cost line has its own complexities and challenges but if we solve M&S we will have the highest impact.

My biggest pain point is I have a very big challenge linking spend to projects, and since I cant do that I cant setup a budget, I cant accurately evaluate past projects spend in details so I can predict future ones better.

My goal is to build something that I can open at anytime during the month and see straight away how much is the total spend, how much is the spend for each of the projects versus their allocated budget, maybe I can have sub allocation to each project like maintenance related spend and operational related spend, and assign further sub categories of the spend to properly track where the cost is going and can easily explain it and have proper control over.

## Current situation

Almost all M&S cost comes from Purchase Orders, and these POs are divided usually by vendor type into three main groups:

1. GOLD: These are POs issued to a hub, the hub stocks parts that are in regular use on global level, to increase availability and reduce stock outs the hubs either stock parts or just work as a bridge between locations and product centers. GOLD POs dont even allow adding any identifiers when they are raised on SAP.
2. EMS: In some cases not a lot, POs are raised directly to the product center majority of these POs are for a service required from the PC.
3. Third Party: These are POs raised to local suppliers mostly service or consumables. Third party POs can be raised on a business system and can assign a project number to it which helps distinguish which project it’s for but doesn’t allow adding more sub identifiers.

Another way to group POs into is by the type of material:

1. POs raised for stocked materials, these are parts that have Part Numbers created in the materials master in SAP, that allows us to place orders for directly on SAP. Most of these orders require demand signal to come in and ideally the PO would not be raised only when there is a shortage in supply, we rely mainly on SAP MRP to do the heavy lifting. Our demand comes mainly from reservations, the team raise a reservation for the part they require with the qty required and that gets raised in two ways, if it's a maintenance related part required for an asset to repair or service it, the team declare the part required in Maximo (Maintenance Management Business System Powered by IBM) and then the team triggers a reservation from Maximo as well, this reservation flows to SAP and gets reflected as demand, if there is supply (No stock on hand and no open POs and no Planned Orders) MRP will create planned order to balance supply with demand, next we have our M&S coordinator going into SAP and reviewing regularly the planned orders and convert them into Purchase Requisitions and then SAP would automatically creates a PO. Where I see the issue here is for the M&S coordintor not being able to add the required identifiers during the planned order conversion process preventing him from even adding something to link this PO to the project, that's why I thought of building my own layer of intelligence, to allow to capture important details about the PO.
2. Second type is non stocked items, these could be either consumables that we don't create part numbers for, or could be a service. These get raised not directly on SAP, we use a separate business sytem called ARIBA, we have a team sitting in KL that process these requests. Our team raises Purchase Requisition in ARIBA and submits it, if the request was for something already in catalog in ARIBA, the PR will automatically generate a PO, if the team submits a special request, they manually populate the information and submit the PR, this request gets assigend to someone in KL team to review the quote provided by the user, and follow specific criteria, mainly based on PO value, if more than 5k they need to gather 3 quotes in total to compare between them, if user requests to go with this sole supplier KL team would create an exemption in a PowerApp which would come to me to approve, assuming I approve they will next process the PR and have a PO generated. The PO would be created eventually within SAP.

A specific example, like Shell Crux project, and specifically let's talk about the current challenges that I have. I want to explain what is the way that things are currently being done versus what I think is the right way of doing it, or let's say the way that I want it to be. But I know I can't do that with our current business systems and with the limitations that we have. It will be very complicated, and that's exactly what I meant earlier by building a layer on top of our business systems. Because if I wanted to rely only on pulling the data from our own business systems, it will be very complicated to try and implement what I have in mind. So this layer that we're building is, to me, I think, inevitable. For example, this exercise that I have done myself by creating an Excel sheet. I initially took the data that was already available from the project P&L, which was created during the tender process. After we've been awarded and the team started discussing placing orders, I created this sheet, and I was trying to link the cost with the initial assumption and kind of keep track of things in terms of total cost, what we are assuming this cost will be, the status, high level, the POs. We'll pick two examples just so you understand the exact challenges, and it will allow me to explain easier by providing detailed information from these examples. Let's start with the CT strings. What I'm interested in mainly is how much is going to be the total cost of these strings and when they are likely to reflect in our P&L. For this example, we have 490K predicted to be invoiced by the supplier in Q4. After we place the PO and the PO number gets generated, I need to manually come here and put the PO number on this sheet so I can keep track of it.

So this is how things are being done at the moment. But what I want in terms of how things should be happening once, hopefully, we build the solution is to have like a simple web app, an interface where the P&L exercise initially gets recorded and input is being done in that interface, and for example, they would put that the coil strings will be costing $350k. I think for the P&L, it doesn't really necessarily have to specify when likely the cost will be hitting, like Q3 2025 or Q4 2025 or a different quarter. I think it should just specify high level, the spend type, the total cost expected, and maybe some comments. I believe this exercise would be done between the sales team or financial controller and myself being the resource manager. So I believe at this level, it should be sufficient to capture all these details. And then it would be saved, and we can say that's it for the initial phase of the P&L exercise. After we get awarded and we start the design phase I expect things to change either a little bit or sometimes a lot resulting in substantial cost increase compared to the initial P&L exercise, let's talk about the CT string, let's assume the P&L exerce was done in June 2024 and all the numbers in terms of cost cost assumtpions where recorded

One of the views I'd like to see how the things look at the high level, something like below table in JSON format. I'd imagine I can update the initial cost assumptions on regular basis and can see how these assumptions evolved, and then we can see the actual invoiced value and the actual Open PO value, these two values would be retrieved from our system, and once we map the PO# to a specific project and spend type we can see also if it's been invoiced and the actual total open value in the system.

Take another example is the ACTive M&S and CIRP M&S, these have 100s of POs within them, it would be ideal if we can drill through and see all these POs, maybe see another sub groups of spends under for example CIRP M&S, like hardware, CIRP Stack, and other sub groups to have an idea about what CIRP M&S has within it, and either another level that we can drill through, all the way until we drill through to the deepest level which would show us the actual POs.

## PO Mapping

This will be one of the main drivers for the product, and I can imagine it to be like an inbox where POs appear in it and requires mapping to the corresponding project and classifying the spend type in a hierarchical way here is how I would imagine the PO processing or mapping to be:

1. Data will be ingested into our system from the "PO details report", let's assume on a daily basis.
2. The POs being displayed in the inbox page will only be the ones that haven't been mapped yet, we will exclude everything that mapping was completed for before.
3. Processor which can be "Resource Manager" or "M&S Coordinator" need to update the mapping of the POs.
4. The data ingested will be at PO line level, we need to aggregate this and display it by PO, but allow to drill through the PO if more details are required. So our main identifier we will use is the PO number, this will be mapped directly to a project, spend type, and its sub categories.
5. The project itself and its associated spend types, categories, and sub categories should have been created already in our database we will only be mapping the spend in the inbox view to the project details we defined. So creating the project and its spend data will need to be created as a separate table in our database.
6. The POs need to be displayed in groups, this will allow the person to process a group of POs with similar attributes each at a time. Or there are custom filters that can be used to display only the POs based on the filters chosen to focus on a specific group when being processed.
7. We need to be able to filter or group POs by the location and sub business line. We will use 3 column values to define this, "Company Code", "Plant", and "Sub Business Line". The main reason for that we will have different stakeholders from teh operations team each might be handling one or more locations and one or more sub business lines in a specific country, so we will need to define the filter rules between the three different columns to view only the ones that belong to a specific operations manager.8
8. There should be another layer, sub group, or filter layer that will allow us to view by the "SLB Vendor Category", focusing on displaying the POs related to the vendor type. And see the POs under each specific vendor.
9. I need to be able to filter by multiple POs, like if I have an existing offline list of POs for a specific project I want to copy and paste into my system to filter these and to do the mapping for that project for the first time.
10. I need to be able to filter the POs by the PO creation date, when I do this mapping exercise for the first time of course I will focus on the POs from recent months and do the mapping for them first, it can also give me indication from PO date to which project this PO might belong to based on that date.

## Project Cost

We need to have a place where we create the different projects and can populate all the cost assumptions, at the start it can be high level where we can define high level assumptions, but be able to create further sub categories, plus be able to update these assumptions and keep versioned history over time and can see how the values evolved over time and can tie them up with comments. This versioned history of the assumptions will be important. Ideally also we should have an overall revenue prediction for the project, and update those revenue assumptions as well while we update the cost to keep track of how things evolved over time.

At the beginning I would imagine the project cost details would look something like below, I think it will be mandatory to have mapping to the cost line as being the highest level of mapping, then to the spend type which can either be "Operational" or "Maintenance" related, then the 3rd mandatory level will be the spend sub category. Any other sub levels will be optional and can be created in hierarchical way.

The example below is for a project called "Shell Crux".

```json
[
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "Coil Strings",
    "Cost (Budget)": "490"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "Coil Drums",
    "Cost (Budget)": "370"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "Coil Monocable",
    "Cost (Budget)": "120"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "ACTive",
    "Cost (Budget)": "350"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "PCE 7in Risers",
    "Cost (Budget)": "250"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Maintenance",
    "Spend Sub Category": "BOP Recert / Spares",
    "Cost (Budget)": "100"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Maintenance",
    "Spend Sub Category": "Treating Iron",
    "Cost (Budget)": "100"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "IH Stand for Stabbing",
    "Cost (Budget)": "150"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "PCE X-Overs / Lifting Caps",
    "Cost (Budget)": "80"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Maintenance",
    "Spend Sub Category": "Maintenance Recert",
    "Cost (Budget)": "150"
  },
  {
    "Sub Business Line": "WIS",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "Critical Ops Spare Parts",
    "Cost (Budget)": "150"
  },
  {
    "Sub Business Line": "TCP",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "CIRP Stack Frame",
    "Cost (Budget)": "150"
  },
  {
    "Sub Business Line": "TCP",
    "Cost Line": "M&S",
    "Spend Type": "Operational",
    "Spend Sub Category": "CIRP M&S",
    "Cost (Budget)": "900"
  }
]
```

## Mapping Actions

Based on the details provided in mapping section and the project cost section we should be able to map a specific PO that we will have in our inbox to a project spend ideally will allow me to track the total amount of PO values associated with a specific spend sub category for example with the budget.
We will apply a filter to the POs being ingested to only include the POs that are under M&S cost line, and we will do the mapping only for these POs, this will the MVP of our project, we will expand this to the other cost lines later after we move to production as additional features.
We will use Valuation Class and G/L Account from PO Details report to filter by only the M&S POs. And do the mapping for these POs to the corresponding project and its spend type, sub category and other levels if applicable.
The first time we will ingest all the POs as of today all the way back maybe a year or two, and we will need to apply the mapping for all these POs at the start, but then once all these POs are mapped we will assume we will ingest POs on a daily level and map only the new ones.

## Views

1. I want to be able to view per project the budget, total PO value issued so far, the total amount of PO value that was invoiced and how much still open. The total PO value is the sum of all the POs value ""Net Order Value in USD". The total invoice value can be taken from "Effective Invoice Amount in Document currency", the open value can be the difference between both.
2. I need to be able to view things in terms of timeline, the time bucket we normally use is monthly or quarterly, for example I want to see for a specific project over the past versioned history of what was the all the different values from first point at the end of each month, and for each quarter, for example if we are now in September 2025, I want to be able to see at the end of Q2 2025 which is end of June 2025, what was the assumptions we had in terms of budgets, the total value of the cost of all the categories for that project, how much we had in terms of total POs, the invoiced amount and the open amount, and can compare this to today's value, as well the revenue we declared at that time and today. This will give us a clear picture of how things evolved in a very clear manner.
3. I want to be able to have a view that shows me the very high level view and be able to drill through all the details I want in great flexibility. For example see first all the projects, maybe have a table view and also something like a timeline view, I can see all the ongoing ones, futures ones and old ones and can pick one of them, shows me the spend high level by spend type, operational vs maintenance, then I can drill through to see the sub categories and the levels below that all the way down to the PO level and PO line level. Together with the important numbers in terms of budget, total value, invoiced value, open value.
4. I want to have all the important graphical plots that provides exceptional UX and requires minimum to no training to navigate through them.
5. I want to be able to see the future expected hit of cost, this maybe will be tricky, as the future hit will involve open POs and also the POs that are yet to be raised, so maybe when we are putting down the assumptions of the budget we should specify when we expect that total assumption to hit and be able to update it. The tricky part for a sub category maybe the cost will be spread over the future months and quarters it will not all be in the same month or quarter and they are also linked to several POs some been raised and some yet to be raised, so we need to be able to have an easy way to project our assumptions in terms of future cost hit and align that with the actual POs when they are raised.
