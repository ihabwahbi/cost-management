## Objective
 Building a product that I can use to manage cost in my company where I can view the different projects spend and track where that spend is actually going. Where I can see the spend in the different buckets and sub buckets. For example, we have a Wireline project we placed huge amount of POs, I'd like to ideally be able to map these POs first of all to the project itself, then add them to specific spend buckets, like I would have POs that are maintenance related, which are like parts to service the tools that will be used on this project, and other category is operational related POs, which are 

## Background Information
I work as Resource Manager and I face a lot of challenges when it comes to managing the cost for the different projects. I want to next explain to you my challenges so you can best help me brainstorm ideas.

I manage several lines in the net income statement (NIS) or as referred to as the P&L. I work in Australia, our GeoUnit is referred to as APG, hosts mainly four countries Australia, Papua New Guinea, New Zealand and Timor Leste. We provide Oil and Gas services, company called SLB, my division is called Reservoir Performance (RP), which includes legacy segments (Wireline, Testing, Well Services). Because of the complexity of having legacy and new division I need to explain to you how things currently structured. When it comes to the business systems and most importantly SAP which is the backbone of all our other business systems we have Division -> Business Line -> Sub Business Line

RP has the following business lines:

RPE, RPI, RPS

Each of these business lines have sub business lines, for example, RPE has WLES, DHT, and others.

Things become complex because we still in many cases refer to the legacy segments when we’re doing for example the business planning cycles (rolling forecast) for example we speak of Wireline segment which technically has WLES and WLPS, where WLES is under RPE in the new structure and WLPS under RPI. For that reason we have an offline excel sheet that links the reports data we download directly from SAP to link things to legacy segments to be able to evaluate the business performance based on both new structure and legacy segments.

Now that I explained our high level business system limitations I will move next to explaining what product I want to build.

The idea is to first build the product to manage the most complex cost line M&S (Materials and Supplies) and then if it works we expand our solution to include the other cost lines, each cost line has its own complexities and challenges but if we solve M&S we will have the highest impact.

My biggest pain point is I have a very big challenge linking spend to projects, and since I cant do that I cant setup a budget, I cant accurately evaluate past projects spend in details so I can predict future ones better.

My goal is to build something that I can open at anytime during the month and see straight away how much is the total spend, how much is the spend for each of the projects versus their allocated budget, maybe I can have sub allocation to each project like maintenance related spend and operational related spend, probably dive even deeper.

Almost all M&S cost comes from Purchase Orders, and these POs are divided usually into three mai groups:

GOLD: These are POs issued to a hub, the hub stocks parts that are in regular use on global level, to increase availability and reduce stock outs the hubs either stock parts or just work as a bridge between locations and product centers.

EMS: In some cases not a lot, POs are raised directly to the product center majority of these POs are for a service required from the PC

Third Party: These are POs raised to local suppliers mostly service or consumables.

Third party POs can be raised on a business system and can assign a project number to it which helps distinguish which project it’s for but doesn’t allow adding more sub identifiers.

GOLD POs dont even allow adding any identifiers when they are raised on SAP.

I think we need to start with defining a way to document information about the POs in a custom database that I build and maybe I link this to the reports I download from SAP.

Some issues I think I will face is whoever raising the PRs for example on SAP like ME51N will not have the bandwidth to record each PO when raised. As well as now we actually rely on planned orders and automate PO being raised in SAP based on demand supply MD04.