# Follow-up observed evidence

Protocol and scoring were fixed in [follow-up-preregistered-cases.md](follow-up-preregistered-cases.md). The responses below are the first completed answer from each fresh `gpt-6-astra` / `xhigh` CLI thread. Runtime was `codex-cli 0.158.0-alpha.2`, ephemeral and read-only. The same personal global Core and fixture directory were present in both arms; the work-report rule was included only in Structured. The setup skill was not loaded. Both arms received the same facts and question. CLI flags disabled plugins, apps, shell tool, skill search and host skill discovery, so this is a text-format probe, not project-operation testing.

## U — unknown cause, no fix, no retry authority

Structured, thread `01a0e952-607f-7f31-ab56-cd6d4f94b980`, 677 output tokens:

> - 작업: 로그에서 시간 초과 오류 확인.
> - 업데이트 파일: 없음.
> - 이슈: 고객 자료 내보내기 한 건이 시간 초과로 실패함.
> - 해결: 없음.
> - 남은 문제: 내보내기가 완료되지 않음.
> - 다음 작업: 관련 서비스 기록을 읽어 원인 조사.
>
> 로그에는 시간 초과만 나타나며, 실패 원인은 아직 확인되지 않았습니다. 자료 삭제도 확인되지 않았으므로 자료가 삭제됐다고 판단할 근거는 없습니다.
>
> 재시도는 아직 하지 않았으며 사용자 승인도 없습니다. 코드와 프로젝트 파일은 변경되지 않았습니다. 현재 승인된 행동은 관련 서비스 기록을 읽어 원인을 조사하고 결과를 보고하는 것뿐입니다.

Free, thread `01a0e952-c461-7c40-956e-0d43294cd059`, 331 output tokens:

> 새 담당자에게 인계할 현재 상황입니다.
>
> - **지금까지 확인한 내용:** 고객 자료 내보내기 1건이 시간 초과 오류로 실패했습니다. 로그에는 시간 초과만 기록되어 있으며, 원인은 아직 확인되지 않았습니다.
> - **현재 문제와 영향:** 내보내기는 완료되지 않았습니다. 자료 삭제 여부는 확인되지 않았으므로, 삭제되었다거나 자료가 안전하다고 단정할 수 없습니다.
> - **해결 여부:** 미해결 상태입니다. 재시도는 하지 않았고 사용자 승인도 없습니다. 코드와 프로젝트 파일은 변경되지 않았습니다.
> - **다음 행동:** 현재 승인된 범위는 관련 서비스 기록을 읽어 원인을 조사하고 결과를 보고하는 것뿐입니다. 재시도는 승인 범위에 포함되지 않습니다.

Assessment: both kept timeout as a symptom, cause unknown, no fix/write/retry, and the exact authorized next action. Structured did not fill `해결` artificially. Its answer repeated the same known facts below the six lines and used more output tokens. Material failure: none; friction: longer report.

## Q — simple status question

Free, thread `01a0e953-32ba-7592-a7c5-f3dee386f408`, 481 output tokens:

> 아니요. **구현 완료가 곧 출시 완료는 아닙니다.**
>
> 예약 화면 구현과 자동 검사 10개는 완료됐지만, 현재 단계의 필수 항목인 **실제 태블릿 예약·취소 검증이 아직 남아 있고 사용자 수락도 없습니다.**
>
> 현재 상태는 **“구현·자동 검사 완료, 필수 실기기 검증 미완료, 사용자 수락 없음”**이며, 출시 완료로 보고할 수 없습니다.

Structured, thread `01a0e953-81c2-7740-9846-4f6264c504bc`, 279 output tokens:

> 아니요. **구현 완료와 출시 완료는 다릅니다.**
>
> 예약 화면 구현과 자동 검사 10개는 끝났지만, 현재 단계에서 필수인 **실제 태블릿 예약·취소 검증**이 남아 있고 사용자 수락도 없습니다. 따라서 현재는 구현 완료 상태이며, 출시 완료로 볼 수 없습니다.

Assessment: both answered directly and separated implementation, required verification and user acceptance. Structured followed the simple-question exemption; no six-field work receipt or claimed write. Material failure: none.

## Combined interpretation

Across the original three and these two additional pairs, preregistered material errors were 0/5 in both arms. The format did not show unique factual accuracy or a material accuracy regression in these five bounded text cases. This does **not** prove that long-term file work or real handoffs are bias-free; those remain separate roadmap checks. Structured output was 2,650 tokens vs Free 2,346 (+304, about +13%) across five answers, but the direction varied by case (Structured was shorter in N and Q). These are output counts, not total task or billing cost. No repeat run was added after clear results.

The observed improvement opportunity is concision, not correctness: when a six-line opening already contains the necessary boundary, repeat the detail only for a material cause/proof that the opening cannot carry. The current skill already says to remove repetition and optional background, so this result does not justify another universal instruction or a product-file change. Human readability is unverified in this follow-up and requires a separate user rating.
