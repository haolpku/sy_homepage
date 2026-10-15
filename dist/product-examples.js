window.productExamples = {
  "legal": {
    "record": {
      "task_id": "pr13-menu-replan",
      "instruction": "Give the committee a decision it can authorize now. Explain what can ship, what must be held or renegotiated, the consequences for the other customer programmes, and the tail that remains after December. Produce a concise counsel memo, a recalculable operating and cash model, a condition/decision register, and unsent customer, supplier and licensor drafts. Cite the record, preserve lot identity, and keep the legal position, production plan, cash model and messages consistent. Unknown claims and approvals should be stated as conditions rather than invented.",
      "input_files": [
        "agreements/strategic_alliance_public.pdf",
        "operations/customer_instruments/PR13_continuity_menu.docx",
        "operations/supply_ledger.csv"
      ],
      "checkpoints": [
        "output/baseline/plan.json",
        "output/final/plan.json"
      ]
    },
    "evidence": {
      "document": "PR13_continuity_menu.docx",
      "paragraphs": [
        "Document HLM-13-M1. Signed by Helio Medical and DIALOG on 12 June 2020. The menu is an executed amendment mechanism for the 10 June PR13 schedule. DIALOG may send one election notice by 16 June 2020 18:00 UTC; the election becomes the July/January schedule for this exercise when acknowledged by Helio's programme mailbox.",
        "FULL: 6,000 TX100 units remain due on 15 July 2020 at USD 26 each. Helio releases no quantity and pays the signed price. This election requires the PackCo Priority Slot and its quoted fee.",
        "BALANCED: 3,000 TX100 units are due on 15 July 2020 at USD 26 each. The remaining 3,000 units are rescheduled to 31 January 2021, and DIALOG grants a USD 6,000 credit against the January invoice. Helio releases the July balance and waives a claim for the rescheduled portion once the election is acknowledged. No PackCo Priority Slot is required.",
        "An election is irrevocable after acknowledgement. If no election is sent, the original 6,000-unit July schedule remains in force. The menu does not grant a licence, alter other customer programmes, or authorize disclosure of Deposit Materials."
      ]
    },
    "output_contract": {
      "classification": [
        "firm",
        "conditional"
      ],
      "elections.pr13_menu": [
        "FULL",
        "BALANCED",
        "none"
      ],
      "conditions": {
        "status": [
          "pending",
          "approved"
        ],
        "action": "Required next step"
      },
      "monthly": [
        "month",
        "die_production",
        "option_quantity"
      ],
      "programmes": [
        "month",
        "programme",
        "assembled",
        "shipped",
        "held_release"
      ],
      "payment_dates": "contractual due date → intended payment date"
    },
    "sources": [
      "instruction.md",
      "PR13_continuity_menu.docx",
      "HANDOFF.md"
    ]
  },
  "research": [
    {
      "name": "发现问题",
      "verb": "READ",
      "file": "stage1_problem/limitations.json",
      "description": "读取论文，抽取具体局限，形成带证据的研究起点。",
      "data": {
        "id": "L1",
        "description": "The problem formulation assumes a strictly turn-based protocol in which exactly one agent acts per time step, so the decisive-error definition (i,t) and all three attribution methods cannot be applied to concurrent, parallel, or asynchronous multi-agent systems where multiple agents act at the same time step.",
        "severity": "high"
      }
    },
    {
      "name": "演化假设",
      "verb": "EVOLVE",
      "file": "stage2_refinement/round3/winner.json",
      "description": "生成并比较候选思路，记录每轮选择与下一轮演化依据。",
      "data": {
        "round": 3,
        "winner_idea_id": "e1_k3",
        "winner_agent_accuracy": 0.1111,
        "ideas_evaluated_count": 4,
        "selection_rationale": "e1_k3 was the only idea to earn a Good decision across all 13 evaluated ideas, outperforming the baseline on both agent accuracy (+1.59 pp) and step accuracy (+0.79 pp) without requiring any engineering rescue rounds."
      }
    },
    {
      "name": "运行实验",
      "verb": "EXPERIMENT",
      "file": "stage3_ablation/ablation_results.json",
      "description": "执行消融实验，把代码运行结果写回结构化实验记录。",
      "data": {
        "plan_id": "A3",
        "result": {
          "idea_id": "ablation_A3",
          "agent_accuracy": 72.22,
          "step_accuracy": 55.56,
          "n_tasks": 126,
          "model": "gemini-3.8-flash",
          "method": "contrastive_attribution_ablation_A3",
          "split": "algorithm_generated",
          "note": "full run (126/126 tasks completed)"
        },
        "success": true
      }
    },
    {
      "name": "撰稿评审",
      "verb": "WRITE & REVIEW",
      "file": "stage4_paper/stage_meta.json",
      "description": "根据实验产物撰写论文，经历模拟评审、回应与修改。",
      "data": {
        "paper_format": "ICLR",
        "review_rounds": 2,
        "review_scores": [
          7,
          6
        ],
        "rebuttal_experiments": 3,
        "final_paper_file": "paper_v2.pdf"
      }
    },
    {
      "name": "反思决策",
      "verb": "REFLECT",
      "file": "stage5_metareview/verdict.json",
      "description": "对方法、证据与评审意见作最终判断，保留下一步改进建议。",
      "data": {
        "verdict": "Refine",
        "reasoning_excerpt": "The submission clears none of the four Accept gates. Its best result, 11.11% agent-level and 6.35% step-level, is exactly tied by ablation arm A0, a chain-of-thought prompt carrying neither proposed mechanism, so the measured improvement over the strongest in-paper baseline is 0.00pp and falls short of the 1pp requirement. The ablation also fails to validate either key component: A2, whi…"
      }
    }
  ],
  "rsi": [
    {
      "iteration": 1,
      "summary": "Reading `harness.py` now.Making the improvements now — I'll increase the turn limit from 1 to a reasonable multi-turn loop, improve the system prompt, add a `write_file` tool, smarter output truncation, and a clean stopping condition. Then I'll compile-check it.Compile check passed. The updated `harness.py` is ready.\n\nHere's what changed from the original:\n\n- **Turn limit**: raised from 1 to 30, so the agent can actually work iteratively.\n- **System prompt**: replaced the bare \"Solve the task using the terminal\" with concrete guidance — explore before acting, verify results, handle errors by changing approach, keep going until done.\n- **`write_file` tool**: added alongside `run_command` to handle multi-line file writes cleanly without shell quoting hazards.\n- **Output trimming**: switched",
      "code": "        for _ in range(1):\n            request = dict(\n                model=self.model_name,\n                messages=messages,\n                tools=tools,\n                tool_choice=\"auto\",\n                temperature=1,\n            )\n            api_base = os.environ.get(\"LITELLM_BASE_URL\") or os.environ.get(\"OPENAI_API_BASE\")\n            api_key = os.environ.get(\"LITELLM_API_KEY\") or os.environ.get(\"OPENAI_API_KEY\")",
      "code_file": "data/initial_harness.py",
      "code_label": "初始代码",
      "feedback": {
        "iteration": 1,
        "reward": 0.2,
        "accepted": true,
        "reason": "scored",
        "per_instance": [
          {
            "instance": "ansible/ansible",
            "reward": 0.0
          },
          {
            "instance": "element-hq/element-web",
            "reward": 0.0
          },
          {
            "instance": "flipt-io/flipt",
            "reward": 0.0
          },
          {
            "instance": "future-architect/vuls",
            "reward": 0.0
          },
          {
            "instance": "gravitational/teleport",
            "reward": 1.0
          }
        ]
      }
    },
    {
      "iteration": 7,
      "summary": "Reading the current harness.py first.The key failure modes from iteration 6:\n- Multiple tasks timed out at exactly 300s — the API_REQUEST_TIMEOUT equals the task timeout, so there's no chance to retry before the whole trial dies.\n- `invalid literal for int() with base 10: '[618,720]'` — the model passed a list literal where `read_file_range` expected plain integers, and `int()` blew up.\n\nLet me read the truncated middle section first, then fix both issues.Good. Now I have full context. Two concrete bugs to fix:\n\n1. `API_REQUEST_TIMEOUT = 300` equals the task wall-clock limit, so a slow API call consumes the entire trial budget and there's no time to retry. Fix: lower to 240s.\n2. `int(arguments[\"start_line\"])` crashes when the model passes a list like `[618, 720]`. Fix: add a robust int coe",
      "code": "MAX_TURNS = 60\nMAX_API_RETRIES = 5\nAPI_REQUEST_TIMEOUT = 240\nDEFAULT_COMMAND_TIMEOUT = 300\n\ndef _coerce_int(value: Any, default: int = 0) -> int:\n    \"\"\"Coerce a model-supplied value to int, tolerating lists and strings.\n\n    The model occasionally passes a list like [618, 720] instead of a plain\n    integer; in that case we take the first element.  Falls back to `default`\n    on any parse failure rather than raising.\n    \"\"\"\n    if isinstance(value, int):\n        return value\n    if isinstance(value, list):\n        return _coerce_int(value[0], default) if value else default\n    try:\n        return int(value)\n    except (TypeError, ValueError):\n        return default",
      "code_file": "reference/best-harness-iter7.py",
      "code_label": "第 7 轮参考代码",
      "feedback": {
        "iteration": 7,
        "reward": 0.6,
        "accepted": true,
        "reason": "scored",
        "per_instance": [
          {
            "instance": "ansible/ansible",
            "reward": 0.0
          },
          {
            "instance": "element-hq/element-web",
            "reward": 1.0
          },
          {
            "instance": "flipt-io/flipt",
            "reward": 1.0
          },
          {
            "instance": "future-architect/vuls",
            "reward": 0.0
          },
          {
            "instance": "gravitational/teleport",
            "reward": 1.0
          }
        ]
      }
    }
  ]
};
