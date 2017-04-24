module dragon.battle0 {
    export class SettlerFactory {
        public static create(SettleType: string, param: Skill): Settler {
            var type = settlers[SettleType];
            if (!type) {
                console.error('技能结算类型%s不存在', SettleType);
            }
            return new type(param);
        }
    }

    export abstract class Settler {
        protected skill: Skill;
        public constructor(skill: Skill) {
            this.skill = skill;
        }
        public abstract settle(me: Unit, tar: Unit);
    }

    namespace settlers {
        export class Damage extends Settler {
            public constructor(skill: Skill) {
                super(skill);
            }
            public settle(me: Unit, tar: Unit) {
                var defattr = model.Attribute[<string>this.skill.skilldata.DefAttr];
                var dmg = (me.attr(model.Attribute.ATK) - (tar.attr(defattr) || 0)) * this.skill.strength;
                dmg = dmg <= 0 ? 1 : dmg;
                var isCritical = false;
                var isHit = me.hit(tar);
                if (isHit) {
                    if (me.critical(tar)) {
                        dmg *= config.CriticalMultiple;
                        isCritical = true;
                    }
                } else {
                    dmg = 0; //Miss
                }
                dmg *= 1 + (me.attr(model.Attribute.Damage) - tar.attr(model.Attribute.Reduction)) / 100;
                dmg = Math.floor(dmg);
                tar.damage(dmg, me);
                tar.view.onDamage(me, dmg, isCritical);
                return dmg;
            }
        }

        export class Heal extends Settler {
            public constructor(skill: Skill) {
                super(skill);
            }
            public settle(me: Unit, tar: Unit) {
                var heal = me.attr(model.Attribute.ATK) * this.skill.strength;
                heal = Math.floor(heal);
                tar.heal(heal);
                tar.view.onHeal(heal);
                return heal;
            }
        }

        export class Buff extends Settler {
            public constructor(skill: Skill) {
                super(skill);
            }
            public settle(me: Unit, tar: Unit) {
                // 清除buff
                if (this.skill.skilldata.ClearBuffList) {
                    tar.removeBuff(this.skill.skilldata.ClearBuffList);
                }
                // 添加buff
                if (this.skill.skilldata.Buff) {
                    tar.addBuff(new battle0.Buff(tar, this.skill.skilldata.Buff, this.skill.skilllv));
                }
                return 0;
            }
        }
    }
}