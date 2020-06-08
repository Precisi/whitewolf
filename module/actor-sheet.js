/**
 * Extend the basic ActorSheet with listeners for rolls
 * @extends {ActorSheet}
 */

export class ActorSheetCoD extends ActorSheet {
	//Extend and override the default options

	static get defaultOptions() {
		const options = super.defaultOptions;
		options.tabs = [
			{navSelector: '.tabs', contentSelector: '.content', initial: 'display'},
		];
		options.classes = options.classes.concat(['cod', 'mortal', 'actor-sheet']);
		options.template = `systems/${game.system.id}/templates/actor/actor-sheet.html`;
		options.width = 610;
		options.height = 610;
		return options;
	}

	getData() {
		const data = super.getData();

		// Prepare inventory
		this._prepareItems(data.actor);

		// Prepare attributes & skills for dialog selections
		data.attributes = this.sortAttrGroups();
		data.skills = this.sortSkillGroups();

		// Provide splat info to sheet
		data.splats = CONFIG.splats;

		// Prep tabs
		data.tabs = {
			display: {
				data: 'display',
				class: 'main',
				template: () => `systems/${game.system.id}/templates/actor/actor-display.html`
			},
			main: {
				data: 'main',
				class: 'main',
				template: () => `systems/${game.system.id}/templates/actor/actor-main.html`
			},
			disciplines: {
				data: 'disciplines',
				class: 'disciplines',
				template: () => `systems/${game.system.id}/templates/actor/actor-disciplines.html`
			},
			merits:{
				data: 'merits',
				class: 'merits',
				template: () => `systems/${game.system.id}/templates/actor/actor-merits.html`
			},
			equipment:{
				data: 'equipment',
				class: 'equipment',
				template: () => `systems/${game.system.id}/templates/actor/actor-equipment.html`
			},
			rolls:{
				data: 'customrolls',
				class: 'customrolls',
				template: () => `systems/${game.system.id}/templates/actor/actor-rolls.html`
			},
			extra:{
				data: 'extra',
				class: 'extra',
				template: () => `systems/${game.system.id}/templates/actor/actor-extra.html`
			}
		};

		//Output current status
		console.log(`Current state of data.actor:`);
		console.log(data.actor);
		console.log(`------------------`);

		return data;
	}

	// Prepare Inventory
	_prepareItems(actorData) {
		actorData.data.inventory = {
			weapons: [],
			armors: [],
			equipments: [],
			vehicles: [],
			merits: [],
			services: [],
			conditions: [],
			tilts: [],
			dreads: [],
			numinas: [],
			disciplines: [],
		};
		const inventory = actorData.data.inventory;

		for (let i of actorData.items) {
			if (i.type == 'weapon') {
				inventory.weapons.push(i);
			}
			if (i.type == 'armor') {
				inventory.armors.push(i);
			}
			if (i.type == 'equipment') {
				inventory.equipments.push(i);
			}
			if (i.type == 'vehicle') {
				inventory.vehicles.push(i);
			}
			if (i.type == 'merit') {
				inventory.merits.push(i);
			}
			if (i.type == 'service') {
				inventory.services.push(i);
			}
			if (i.type == 'condition') {
				inventory.conditions.push(i);
			}
			if (i.type == 'tilt') {
				inventory.tilts.push(i);
			}
			if (i.type == 'dread') {
				inventory.dreads.push(i);
			}
			if (i.type == 'numina') {
				inventory.numinas.push(i);
			}
			if (i.type == 'discipline') {
				inventory.disciplines.push(i);
			}
		}
	}

	// Sort Attributes for display on roll pool dialogs
	sortAttrGroups() {
		let skills = duplicate(CONFIG.skills);
		let attributes = duplicate(CONFIG.attributes);
		let skillGroups = duplicate(CONFIG.groups);
		let attrGroups = duplicate(CONFIG.groups);

		for (let g in skillGroups) {
			skillGroups[g] = {};
			attrGroups[g] = {};
		}

		for (let s in skills) {
			let skillGroup = CONFIG.groupMapping[s];
			skillGroups[skillGroup][s] = skills[s];
		}
		for (let a in attributes) {
			let attrGroup = CONFIG.groupMapping[a];
			attrGroups[attrGroup][a] = attributes[a];
		}

		let displayAttrGroups = Object.keys(attrGroups)
			.map((key) => {
				const newKey = CONFIG.groups[key];
				return {[newKey]: attrGroups[key]};
			})
			.reduce((a, b) => Object.assign({}, a, b));

		for (let g in displayAttrGroups) {
			for (let a in displayAttrGroups[g]) {
				displayAttrGroups[g][a] +=
					' (' + this.actor.data.data.attributes[a].value + ')';
			}
		}
		return displayAttrGroups;
	}

	// Sort Skills for display on roll pool dialogs
	sortSkillGroups() {
		let skills = duplicate(CONFIG.skills);
		let attributes = duplicate(CONFIG.attributes);
		let skillGroups = duplicate(CONFIG.groups);
		let attrGroups = duplicate(CONFIG.groups);

		for (let g in skillGroups) {
			skillGroups[g] = {};
			attrGroups[g] = {};
		}

		for (let s in skills) {
			let skillGroup = CONFIG.groupMapping[s];
			skillGroups[skillGroup][s] = skills[s];
		}
		for (let a in attributes) {
			let attrGroup = CONFIG.groupMapping[a];
			attrGroups[attrGroup][a] = attributes[a];
		}

		let displaySkillGroups = Object.keys(skillGroups)
			.map((key) => {
				const newKey = CONFIG.groups[key];
				return {[newKey]: skillGroups[key]};
			})
			.reduce((a, b) => Object.assign({}, a, b));

		for (let g in displaySkillGroups) {
			for (let s in displaySkillGroups[g]) {
				displaySkillGroups[g][s] +=
					' (' + this.actor.data.data.skills[s].value + ')';
			}
		}
		return displaySkillGroups;
	}

	// Activate event listeners using the prepared sheet HTML
	activateListeners(html) {
		super.activateListeners(html);

		// Click attribute/skill roll
		html.find('.roll-pool').click((event) => {
			let defaultSelection = $(event.currentTarget).attr('data-skill');

			let dialogData = {
				defaultSelectionAtt: defaultSelection,
				defaultSelectionSkill: defaultSelection,
				skills: this.sortSkillGroups(),
				attributes: this.sortAttrGroups(),
				groups: CONFIG.groups,
			};

			renderTemplate(`systems/${game.system.id}/templates/pool-dialog.html`, dialogData).then(
				(html) => {
					new Dialog({
						title: 'Roll Dice Pool',
						content: html,
						buttons: {
							Yes: {
								icon: '<i class="fa fa-check"></i>',
								label: 'Yes',
								callback: (html) => {
									let attributeSelected = html
										.find('[name="attributeSelector"]')
										.val();
									let poolModifier = html.find('[name="modifier"]').val();
									let skillSelected = html.find('[name="skillSelector"]').val();
									let exploderSelected = html
										.find('[name="exploderSelector"]')
										.val();
									if (attributeSelected === 'none' || skillSelected === 'none')
										console.log(`Invalid pool selected.`);
									else
										this.actor.rollPool(
											attributeSelected,
											skillSelected,
											poolModifier,
											exploderSelected
										);
									console.log(``);
								},
							},
							cancel: {
								icon: '<i class="fas fa-times"></i>',
								label: 'Cancel',
							},
						},
						default: 'Yes',
					}).render(true);
				}
			);
		});

		// Click weapon roll
		html.find('.weapon-roll').click((event) => {
			let itemId = $(event.currentTarget).parents('.item').attr('data-item-id');
			let item = this.actor.getEmbeddedEntity('OwnedItem', itemId);
			let weaponName = item.name;
			let attackType = item.data.attack.value;
			let damage = item.data.damage.value;
			let formula = CONFIG.attackSkills[attackType];
			formula = formula.split(',');
			// Formula[0] = attribute, Formula[1] = skill (e.g., 'str', 'brawl')

			let defaultSelectionAtt = formula[0];
			let defaultSelectionSkill = formula[1];

			let dialogData = {
				defaultSelectionAtt: defaultSelectionAtt,
				defaultSelectionSkill: defaultSelectionSkill,
				skills: this.sortSkillGroups(),
				attributes: this.sortAttrGroups(),
				groups: CONFIG.groups,
			};

			// If a target is selected
			if (game.user.targets.size == 1) {
				let target = game.user.targets.values().next().value.actor.data.name;
				let targetDef =
					-1 *
					game.user.targets.values().next().value.actor.data.data.advantages.def
						.value;

				if (attackType === 'ranged') {
					console.log(`Target's defense not applied`);
					this.actor.weaponRollPool(
						formula[0],
						formula[1],
						0,
						'ten',
						weaponName,
						damage,
						target
					);
					console.log(``);
				} else {
					this.actor.weaponRollPool(
						formula[0],
						formula[1],
						targetDef,
						'ten',
						weaponName,
						damage,
						target
					);
					console.log(``);
				}
			} else {
				// If no target selected, create popup dialogue
				renderTemplate(
					`systems/${game.system.id}/templates/pool-dialog.html`,
					dialogData
				).then((html) => {
					new Dialog({
						title: 'Roll Dice Pool',
						content: html,
						buttons: {
							Yes: {
								icon: '<i class="fa fa-check"></i>',
								label: 'Yes',
								callback: (html) => {
									let attributeSelected = html
										.find('[name="attributeSelector"]')
										.val();
									let poolModifier = html.find('[name="modifier"]').val();
									let skillSelected = html.find('[name="skillSelector"]').val();
									let exploderSelected = html
										.find('[name="exploderSelector"]')
										.val();
									if (attributeSelected === 'none' || skillSelected === 'none')
										console.log(`Invalid pool selected.`);
									else
										this.actor.weaponRollPool(
											attributeSelected,
											skillSelected,
											poolModifier,
											exploderSelected,
											weaponName,
											damage,
											'none'
										);
									console.log(``);
								},
							},
							cancel: {
								icon: '<i class="fas fa-times"></i>',
								label: 'Cancel',
							},
						},
						default: 'Yes',
					}).render(true);
				});
			}
		});

		// Click attribute task roll
		html.find('.att-roll-pool').click((event) => {
			let dialogData = {
				attributes: this.sortAttrGroups(),
				groups: CONFIG.groups,
			};

			renderTemplate(
				`systems/${game.system.id}/templates/att-pool-dialog.html`,
				dialogData
			).then((html) => {
				new Dialog({
					title: 'Roll Dice Pool',
					content: html,
					buttons: {
						Yes: {
							icon: '<i class="fa fa-check"></i>',
							label: 'Yes',
							callback: (html) => {
								let attribute1Selected = html
									.find('[name="attribute1Selector"]')
									.val();
								let attribute2Selected = html
									.find('[name="attribute2Selector"]')
									.val();
								let poolModifier = html.find('[name="modifier"]').val();

								let exploderSelected = html
									.find('[name="exploderSelector"]')
									.val();
								if (
									attribute1Selected === 'none' &&
									attribute2Selected === 'none'
								)
									console.log(`Invalid pool selected.`);
								else
									this.actor.attTaskPool(
										attribute1Selected,
										attribute2Selected,
										poolModifier,
										exploderSelected
									);
								console.log(``);
							},
						},
						cancel: {
							icon: '<i class="fas fa-times"></i>',
							label: 'Cancel',
						},
					},
					default: 'Yes',
				}).render(true);
			});
		});

		// Click custom roll 'Roll' button
		html.find('.roll-button').mousedown((ev) => {
			let rollIndex = Number(
				$(ev.currentTarget).parents('.rolls').attr('data-index')
			);
			let thisRoll = this.actor.data.data.rolls[rollIndex];
			if (thisRoll.exploder === undefined) {
				thisRoll.exploder = 'ten';
			}
			this.actor.rollPool(
				thisRoll.primary,
				thisRoll.secondary,
				thisRoll.modifier,
				thisRoll.exploder
			);
		});

		// Drag events for macros.
		if (this.actor.owner) {
			let handler = (ev) => this._onDragItemStart(ev);
			// Find all items on the character sheet.
			html.find('li.item').each((i, li) => {
				// Ignore for the header row.
				if (li.classList.contains('item-header')) return;
				// Add draggable attribute and dragstart listener.
				li.setAttribute('draggable', true);
				li.addEventListener('dragstart', handler, false);
			});
		}

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Update Inventory Item
		html.find('.item-edit').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.find(
				(i) => i.id == li.attr('data-item-id')
			);
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			let defaultSelection = 'Cancel';
			let dialogData = {
				defaultSelection: defaultSelection,
			};
			renderTemplate(`systems/${game.system.id}/templates/del-confirm.html`, dialogData).then(
				(html) => {
					new Dialog({
						title: 'Confirm deletion',
						content: html,
						buttons: {
							Yes: {
								icon: '<i class="fa fa-check"></i>',
								label: 'Yes',
								callback: (html) => {
									this.actor.deleteEmbeddedEntity(
										'OwnedItem',
										li.data('itemId')
									);
									li.slideUp(200, () => this.render(false));
								},
							},
							cancel: {
								icon: '<i class="fas fa-times"></i>',
								label: 'Cancel',
							},
						},
						default: 'Yes',
					}).render(true);
				}
			);
		});

		// Add item
		html.find('.item-add').click((ev) => {
			const type = $(ev.currentTarget).attr('data-item-type');
			if (type != 'roll')
				this.actor.createEmbeddedEntity('OwnedItem', {
					type: type,
					name: `New ${type.capitalize()}`,
				});
			else {
				let rolls = duplicate(this.actor.data.data.rolls);
				rolls.push({name: 'New Roll', exploder: 'ten'});
				this.actor.update({'data.rolls': rolls});
			}
		});

		// Update roll name
		html.find('.roll-name').change((ev) => {
			let rollIndex = $(ev.currentTarget).parents('.rolls').attr('data-index');
			let newName = ev.target.value;
			let rollList = duplicate(this.actor.data.data.rolls);
			rollList[rollIndex].name = newName;
			this.actor.update({'data.rolls': rollList});
		});

		// Delete roll
		html.find('.roll-delete').click((ev) => {
			let rollIndex = Number(
				$(ev.currentTarget).parents('.rolls').attr('data-index')
			);
			let rollList = duplicate(this.actor.data.data.rolls);
			rollList.splice(rollIndex, 1);
			this.actor.update({'data.rolls': rollList});
		});

		// Change custom roll attribute
		html.find('.roll.attribute-selector').change((ev) => {
			let rollIndex = Number(
				$(ev.currentTarget).parents('.rolls').attr('data-index')
			);
			let primary = $(ev.currentTarget).hasClass('primary');
			let secondary = $(ev.currentTarget).hasClass('secondary');
			let modifier = $(ev.currentTarget).hasClass('modifier');
			let exploder = $(ev.currentTarget).hasClass('exploder');
			let rollList = duplicate(this.actor.data.data.rolls);

			if (primary) rollList[rollIndex].primary = ev.target.value;
			if (secondary) rollList[rollIndex].secondary = ev.target.value;
			if (modifier) rollList[rollIndex].modifier = Number(ev.target.value);
			if (exploder) rollList[rollIndex].exploder = ev.target.value;

			this.actor.update({'data.rolls': rollList});
		});
	}
}
