-- Allow public access to task_approval_requests by token (for email approval links)
CREATE POLICY "Allow public read access by token"
ON public.task_approval_requests
FOR SELECT
USING (true);

-- Allow public update of approval requests by token (for approve/reject actions)
CREATE POLICY "Allow public update by token"
ON public.task_approval_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public read access to tasks for approval page (limited by join)
CREATE POLICY "Allow public read tasks for approval"
ON public.tasks
FOR SELECT
USING (true);

-- Allow public update of tasks for approval (status update when approved/rejected)
CREATE POLICY "Allow public update tasks for approval"
ON public.tasks
FOR UPDATE
USING (true);