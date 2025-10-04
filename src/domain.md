Bounded context: TaskTracker

workflow: "Add Task"

triggered by:  
    Command Submition event
input: 
    Description AND optional Priority (from input event)
output: 
   AlternationResult (to show the playser)

// Data

data Task = 
    Description
    AND Priority
    AND Status

// Choices

data Priority = Low 
    OR Medium 
    OR High

// Constrained 

data Descriptioin = non empty string, trimmed

ErrorMessage = 
    | EmptyDescription
    | InvalidPriority
    | DuplicateTaskDescription
    | SystemError

AlternationResult = 
    Success of Task 
    Failure of ErrorMessage

type AddTask = Description * optional Priority -> AlternationResult


Entity defintion
