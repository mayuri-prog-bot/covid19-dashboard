import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SelectionModel, SelectionChange } from '@angular/cdk/collections';

export enum ColumnType {
  Number,
  String,
}

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  classes: string[];
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent<T> implements OnInit {
  ColumnType = ColumnType;

  @Input() data: T[];
  @Input() columns: ColumnDefinition[];
  @Input()
  set selectedItem(value: T) {
    if (value) {
      this.selection.select(value);
    } else {
      this.selection.deselect();
    }
  }

  @Output() selectionChanged = new EventEmitter<SelectionChange<T>>();

  public selection = new SelectionModel<T>(false, [this.selectedItem]);

  constructor() {
    this.selection.changed.subscribe((change) => {
      this.selectionChanged.emit(change);
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.selection.select(this.data[0]);
    }
  }

  public isNumber(val: any): boolean {
    return typeof val === 'number';
  }

  public getDisplayedColumns(): string[] {
    return this.columns.map((column) => column.name);
  }
}
