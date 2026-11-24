// Scoped extension of the original onboarding. No separate page or router.
function YaoOnboardingStage(workflow) {
  if (workflow.phase === "role") return 0;
  return workflow.selectedTask == null ? 1 : 2;
}

function YaoReturnToOnboardingStep(scope, target, cancelCurrentTask) {
  const current = oo(scope);
  if (!Number.isInteger(target) || target < 0 || target >= YaoOnboardingStage(current)) return false;
  cancelCurrentTask();
  scope.set(no, {
    ...current,
    phase: target === 0 ? "role" : "task",
    selectedTask: null,
    permissionStatus: "not-requested",
    declinedTasks: [],
    advancedCapabilitiesStatus: undefined,
    advancedCapabilitiesToSetup: undefined,
    completedImport: undefined,
  });
  return true;
}

function YaoStepProgress({activeIndex, onNavigate, disabled}) {
  const jsx = k();
  const labels = ["选择角色", "任务推荐", "工作演示"];
  return jsx.jsx("nav", {
    className: "yao-onboarding-steps",
    "aria-label": "新人引导步骤",
    children: labels.map((label, index) => jsx.jsx("button", {
      type: "button",
      className: "yao-onboarding-step",
      "aria-current": index === activeIndex ? "step" : undefined,
      "data-complete": index < activeIndex,
      "aria-label": `第${index + 1}步：${label}${index < activeIndex ? "，点击返回" : ""}`,
      title: index < activeIndex ? `返回${label}` : label,
      disabled: disabled || index > activeIndex,
      onClick: () => onNavigate(index),
      children: jsx.jsx("span", {className: "yao-onboarding-step-bar", "aria-hidden": true}),
    }, label)),
  });
}

function YaoNavigableOnboarding(props) {
  const React = h(), jsx = k(), scope = i(Fo);
  const workflow = J(no) ?? oo(scope);
  const activeIndex = YaoOnboardingStage(workflow);
  const [revision, setRevision] = React.useState(0);
  const abortRoleSubmission = React.useRef(null);
  const navigate = target => {
    if (props.isAdvancePending || target >= activeIndex) return;
    if (YaoReturnToOnboardingStep(scope, target, () => {
      abortRoleSubmission.current?.();
      props.onYaoCancelTask();
    })) {
      props.shellControls.setHeaderHasScrolledContent(false);
      props.shellControls.setBackgroundVisibility(target === 0 ? "visible" : "hidden");
      setRevision(value => value + 1);
    }
  };
  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(Pf, {
        ...props,
        yaoAbortRef: abortRoleSubmission,
        yaoPersonalizedSuggestionsEnabled: scope.get(un)?.personalizedSuggestionsEnabled ?? true,
        yaoProgress: jsx.jsx(YaoStepProgress, {activeIndex, onNavigate: navigate, disabled: props.isAdvancePending}),
      }, revision),
      jsx.jsxs("div", {
        className: "yao-onboarding-navigation",
        children: [
          jsx.jsx(me, {
            color: "ghostTertiary", size: "small", type: "button",
            disabled: props.isAdvancePending || activeIndex === 0,
            onClick: () => navigate(activeIndex - 1),
            children: "← 上一步",
          }),
          activeIndex > 0 ? jsx.jsx(me, {
            color: "ghostTertiary", size: "small", type: "button",
            disabled: props.isAdvancePending,
            onClick: () => navigate(0),
            children: "换角色",
          }) : null,
        ],
      }),
    ],
  });
}
