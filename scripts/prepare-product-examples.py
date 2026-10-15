"""Extract selected, attributable example fields from local demo deliveries."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--data-root', required=True, type=Path)
args = parser.parse_args()
repo = Path(__file__).resolve().parent.parent
source_root = args.data_root
sources = []


def read(relative):
    path = source_root / relative
    data = path.read_bytes()
    if relative not in {item['source_path'] for item in sources}:
        sources.append({'source_path': relative, 'sha256': hashlib.sha256(data).hexdigest()})
    return data.decode('utf-8')


def record(relative):
    return json.loads(read(relative))


legal = '法律/harbor-legal-20261013-r2/tasks/legal/pr13-menu-replan/'
instruction = read(legal + 'instruction.md')
handoff = read(legal + 'environment/workspace/HANDOFF.md')
doc_path = legal + 'environment/workspace/operations/customer_instruments/PR13_continuity_menu.docx'
doc_bytes = (source_root / doc_path).read_bytes()
sources.append({'source_path': doc_path, 'sha256': hashlib.sha256(doc_bytes).hexdigest()})
with zipfile.ZipFile(source_root / doc_path) as archive:
    xml = ET.fromstring(archive.read('word/document.xml'))
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = [''.join(node.itertext()) for node in xml.findall('.//w:t', ns)]

legal_example = {
    'record': {
        'task_id': 'pr13-menu-replan',
        'instruction': instruction.split('\n\n')[2],
        'input_files': [
            'agreements/strategic_alliance_public.pdf',
            'operations/customer_instruments/PR13_continuity_menu.docx',
            'operations/supply_ledger.csv',
        ],
        'checkpoints': ['output/baseline/plan.json', 'output/final/plan.json'],
    },
    'evidence': {
        'document': 'PR13_continuity_menu.docx',
        'paragraphs': paragraphs[1:],
    },
    'output_contract': {
        'classification': ['firm', 'conditional'],
        'elections.pr13_menu': ['FULL', 'BALANCED', 'none'],
        'conditions': {'status': ['pending', 'approved'], 'action': 'Required next step'},
        'monthly': ['month', 'die_production', 'option_quantity'],
        'programmes': ['month', 'programme', 'assembled', 'shipped', 'held_release'],
        'payment_dates': 'contractual due date → intended payment date',
    },
    'sources': ['instruction.md', 'PR13_continuity_menu.docx', 'HANDOFF.md'],
}
assert all(token in handoff for token in ['classification', 'pr13_menu', 'payment_dates', 'die_production'])

research = 'Autoresearch/autoresearch_sample_run41fcb57b/'
limitations = record(research + 'stage1_problem/limitations.json')['limitations']
winner = record(research + 'stage2_refinement/round3/winner.json')
ablation = record(research + 'stage3_ablation/ablation_results.json')['ablation_results'][2]
paper = record(research + 'stage4_paper/stage_meta.json')
verdict = record(research + 'stage5_metareview/verdict.json')
research_example = [
    {'name': '发现问题', 'verb': 'READ', 'file': 'stage1_problem/limitations.json',
     'description': '读取论文，抽取具体局限，形成带证据的研究起点。',
     'data': {key: limitations[0][key] for key in ['id', 'description', 'severity']}},
    {'name': '演化假设', 'verb': 'EVOLVE', 'file': 'stage2_refinement/round3/winner.json',
     'description': '生成并比较候选思路，记录每轮选择与下一轮演化依据。', 'data': winner},
    {'name': '运行实验', 'verb': 'EXPERIMENT', 'file': 'stage3_ablation/ablation_results.json',
     'description': '执行消融实验，把代码运行结果写回结构化实验记录。',
     'data': {'plan_id': ablation['plan_id'], 'result': ablation['result'], 'success': ablation['success']}},
    {'name': '撰稿评审', 'verb': 'WRITE & REVIEW', 'file': 'stage4_paper/stage_meta.json',
     'description': '根据实验产物撰写论文，经历模拟评审、回应与修改。',
     'data': {key: paper[key] for key in ['paper_format', 'review_rounds', 'review_scores', 'rebuttal_experiments', 'final_paper_file']}},
    {'name': '反思决策', 'verb': 'REFLECT', 'file': 'stage5_metareview/verdict.json',
     'description': '对方法、证据与评审意见作最终判断，保留下一步改进建议。',
     'data': {'verdict': verdict['verdict'], 'reasoning_excerpt': verdict['reasoning'][:390] + '…'}},
]

rsi = 'RSI-SWE/task_rsi_harness_evolution/'
traces = record(rsi + 'traces/reference_run_traces.json')['traces']
initial = read(rsi + 'data/initial_harness.py')
best = read(rsi + 'reference/best-harness-iter7.py')
initial_lines = initial.splitlines()
initial_start = next(i for i, line in enumerate(initial_lines) if 'for _ in range(1)' in line)
best_lines = best.splitlines()
coerce_start = next(i for i, line in enumerate(best_lines) if line.startswith('def _coerce_int'))
coerce_end = next((i for i in range(coerce_start+1, len(best_lines)) if best_lines[i].startswith(('def ', 'async def ', 'class '))), coerce_start+25)
best_constants = '\n'.join(line for line in best_lines[:55] if re.match(r'^(MAX_TURNS|MAX_API_RETRIES|API_REQUEST_TIMEOUT|DEFAULT_COMMAND_TIMEOUT) =', line))
example_iterations = []
for index in [0, 6]:
    trace = traces[index]
    iteration = trace['iteration']
    code = '\n'.join(initial_lines[initial_start:initial_start+10]) if iteration == 1 else best_constants + '\n\n' + '\n'.join(best_lines[coerce_start:min(coerce_end, coerce_start+25)]).rstrip()
    example_iterations.append({
        'iteration': iteration,
        'summary': trace['proposer_response_summary'],
        'code': code,
        'code_file': 'data/initial_harness.py' if iteration == 1 else 'reference/best-harness-iter7.py',
        'code_label': '初始代码' if iteration == 1 else '第 7 轮参考代码',
        'feedback': {
            'iteration': iteration,
            'reward': trace['evaluation']['reward'],
            'accepted': trace['evaluation']['accepted'],
            'reason': trace['evaluation']['reason'],
            'per_instance': [
                {'instance': re.sub(r'-[0-9a-f]{16,}.*$', '', case['instance_id'].removeprefix('instance_')).replace('__', '/'), 'reward': case['reward']}
                for case in trace['evaluation']['per_instance']
            ],
        },
    })

result = {'legal': legal_example, 'research': research_example, 'rsi': example_iterations}
output = repo / 'dist/product-examples.js'
output.write_text('window.productExamples = ' + json.dumps(result, ensure_ascii=False, indent=2) + ';\n')
provenance = repo / 'dist/products-provenance.json'
manifest = json.loads(provenance.read_text())
manifest['example_sources'] = sources
manifest['example_transformation'] = 'Selected source fields and verbatim excerpts. Legal record/output interface are a display adaptation, not a fabricated model answer. Research reflection explicitly truncates its reasoning excerpt. RSI repository labels normalize IDs; initial code is the starting scaffold, not the iteration-1 output.'
manifest['example_asset'] = {'path': 'product-examples.js', 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
provenance.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('Prepared legal, five-stage research and RSI source excerpts.')
