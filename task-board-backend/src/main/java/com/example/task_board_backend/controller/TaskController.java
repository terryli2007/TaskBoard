package com.example.task_board_backend.controller;

import com.example.task_board_backend.model.Task;
import com.example.task_board_backend.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {
    @Autowired
    private TaskService taskService;

//    @GetMapping
//    public List<Task> getTasks() {
//        return taskService.getAllTasks();
//    }

    @PostMapping
    public Task addTask(@RequestBody Task task) {
        if (task.getUserId() == null) {
            throw new RuntimeException("User ID is required for RLS");
        }
        return taskService.saveTask(task);
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasksByUserId(@PathVariable UUID userId) {
        return taskService.getTasksByUserId(userId);
    }

    @PatchMapping("/{id}/status")
    public Task updateTaskStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, String> payload) {
        String newStatus = payload.get("status");
        return taskService.updateStatus(id, newStatus);
    }

    @PostMapping("/{id}/delete")
    public void deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
    }

    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable UUID id) {
        return taskService.getTaskById(id);
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<Task> updateTask(@PathVariable UUID id, @RequestBody Task taskDetails) {
        return taskService.updateTask(id, taskDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}